import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { matchRoutes, RouteMatch } from './matchRoutes.js';
import { Route } from './Route.js';
import {
  LoadingAppearance,
  Location,
  NavigateOptions,
  RenderingDisposition,
  RouterEvent,
  RouterOptions,
  To,
} from './types.js';
import { AbortError, getLeafController, noop, toLocation } from './utils.js';
import {
  getActiveController,
  getRenderingDisposition,
  reconcileControllers,
  RouteController,
} from './RouteController.js';
import { NotFoundRouteController } from './NotFoundRouteController.js';

/**
 * A router that matches routes by a location.
 *
 * @template Context A context provided to {@link RouteOptions.dataLoader route data loaders}.
 * @group Routing
 */
export class Router<Context = any> {
  /**
   * `true` if the router is used in the server environment.
   */
  readonly isSSR: boolean = typeof window === 'undefined';

  /**
   * Routes that a router can render.
   */
  routes: readonly Route<any, any, any, Context>[];

  /**
   * A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  context: Context;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   */
  errorComponent: ComponentType | undefined;

  /**
   * A component that is rendered when a route is being loaded.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A component that is rendered if {@link react-corsair!notFound notFound} was called during route loading or
   * rendering
   */
  notFoundComponent: ComponentType | undefined;

  /**
   * What to render when a component or data are being loaded.
   */
  loadingAppearance: LoadingAppearance | undefined;

  /**
   * Where the route is rendered.
   */
  renderingDisposition: RenderingDisposition | undefined;

  /**
   * A root controller rendered in the topmost {@link react-corsair!Outlet Outlet}.
   *
   * @see {@link navigate}
   */
  rootController: RouteController<any, any, Context> = new NotFoundRouteController(this, '');

  /**
   * A controller of the intercepted route, or `null` if there's no intercepted route.
   *
   * @see {@link navigate}
   */
  interceptedController: RouteController<any, any, Context> | null = null;

  /**
   * The location of the latest router {@link navigate navigation}.
   */
  location: Location = { pathname: '', searchParams: {}, hash: '', state: undefined };

  /**
   * An array of intercepted routes. Route can present multiple times in this array if {@link _registerInterceptedRoute}
   * was called multiple times with the same route.
   */
  protected _interceptedRoutes: Route[] = [];

  /**
   * Manages router subscribers.
   */
  protected _pubSub = new PubSub<RouterEvent>();

  /**
   * Creates a new instance of a {@link react-corsair!Router Router}.
   *
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: RouterOptions<Context>) {
    this.routes = options.routes;
    this.context = options.context!;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
    this.loadingAppearance = options.loadingAppearance;
    this.renderingDisposition = options.renderingDisposition;
  }

  /**
   * Returns the array of matched routes and extracted params for a given location.
   *
   * @param to The location to match.
   */
  match(to: To): RouteMatch[] {
    const location = toLocation(to);
    return matchRoutes(location.pathname, location.searchParams, this.routes);
  }

  /**
   * Looks up a route in {@link routes} that matches a location, loads its data anc component, and notifies subscribers.
   *
   * @param to A location or a route to navigate to.
   * @param options Navigate options.
   */
  navigate(to: To, options: NavigateOptions = {}): void {
    const prevLocation = this.location;
    const location = toLocation(to);
    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);

    this.location = location;

    let prevController: RouteController | null;
    let nextController: RouteController;

    // Check that the matched route is intercepted
    const isIntercepted =
      !this.isSSR &&
      !options.isInterceptionBypassed &&
      routeMatches.length !== 0 &&
      this._interceptedRoutes.indexOf(routeMatches[routeMatches.length - 1].route) !== -1;

    if (isIntercepted) {
      prevController = getActiveController(this.interceptedController);
      nextController = reconcileControllers(this, prevController, routeMatches)!;

      this.interceptedController = nextController;
    } else {
      prevController = getActiveController(this.rootController);
      nextController =
        reconcileControllers(this, prevController, routeMatches) ||
        new NotFoundRouteController(this, location.pathname);

      this.rootController = nextController;
      this.interceptedController = null;
    }

    this._pubSub.publish({
      type: 'navigate',
      prevController,
      prevLocation,
      controller: nextController,
      location,
      isIntercepted,
    });

    if (this.rootController !== nextController && this.interceptedController !== nextController) {
      // Navigation was superseded
      return;
    }

    // Lookup a controller that requires loading
    for (
      let controller: RouteController | null = nextController;
      controller !== null;
      controller = controller.childController
    ) {
      if (controller.status === 'loading' && (!this.isSSR || getRenderingDisposition(controller) === 'server')) {
        controller.reload();
      }
    }

    // Abort loading of the replaced controller
    prevController?.abort(AbortError('Router navigation occurred'));
  }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * The returned promise isn't rejected if component or data loading fails.
   *
   * @param to A location or a route to prefetch.
   * @returns A promise that can be aborted to discard prefetching.
   */
  prefetch(to: To): AbortablePromise<void> {
    const promise = new AbortablePromise<void>((resolve, _reject, signal) => {
      const location = toLocation(to);
      const promises = [];

      for (const { route, params } of this.match(location)) {
        if (route.component === undefined) {
          promises.push(route.loadComponent());
        }
        try {
          promises.push(route.dataLoader?.({ route, router: this, params, signal, isPrefetch: true }));
        } catch {}
      }

      Promise.allSettled(promises).then(() => resolve());
    });

    promise.catch(noop);

    return promise;
  }

  /**
   * If there's an {@link interceptedController} then it is made a {@link rootController}. No-op otherwise.
   */
  cancelInterception(): void {
    if (this.interceptedController === null) {
      return;
    }

    const prevController = this.rootController;

    this.rootController = this.interceptedController;
    this.interceptedController = null;

    prevController.abort(AbortError('Route interception was cancelled'));

    this._pubSub.publish({
      type: 'navigate',
      prevController,
      prevLocation: this.location,
      controller: this.rootController,
      location: this.location,
      isIntercepted: false,
    });
  }

  /**
   * Subscribes a listener to events published by a router.
   *
   * @param listener A listener to subscribe.
   * @returns A callback that unsubscribe a listener.
   */
  subscribe(listener: (event: RouterEvent) => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  /**
   * Registers a `route` interceptor, so when the `route` is {@link navigate navigated to} it populates
   * the {@link interceptedController} instead of the {@link rootController}.
   *
   * @param route The route to intercept.
   * @returns A callback that unregisters route interception.
   */
  protected _registerInterceptedRoute(route: Route<any, any, any, Context>): () => void {
    const interceptedRoutes = this._interceptedRoutes;

    interceptedRoutes.push(route);

    let isRegistered = true;

    return () => {
      if (!isRegistered) {
        // Can unregister only once
        return;
      }

      isRegistered = false;

      const index = interceptedRoutes.indexOf(route);

      interceptedRoutes.splice(index, 1);

      if (
        interceptedRoutes.indexOf(route, index) === -1 &&
        getLeafController(this.interceptedController)?.route === route
      ) {
        this.cancelInterception();
      }
    };
  }
}
