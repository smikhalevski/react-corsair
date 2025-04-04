import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { matchRoutes } from './matchRoutes';
import { Route } from './Route';
import { Fallbacks, Location, NavigateOptions, RouterEvent, RouterOptions, To } from './types';
import { AbortError, getTailController, noop, toLocation } from './utils';
import { getOrLoadRouteState, RouteController } from './RouteController';
import { reconcileControllers } from './reconcileControllers';

/**
 * A router that matches routes by a location.
 *
 * @template Context A context provided to {@link RouteOptions.dataLoader route data loaders}.
 * @group Routing
 */
export class Router<Context = any> implements Fallbacks {
  /**
   * `true` if router is used in the server environment.
   */
  readonly isSSR: boolean = false;

  /**
   * Routes that a router can render.
   */
  routes: readonly Route<any, any, any, Context>[];

  /**
   * A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  context: Context;

  /**
   * A root controller rendered in a router {@link react-corsair!Outlet Outlet}, or `null` if there's no matching route
   * or if {@link navigate navigation} didn't occur yet.
   *
   * @see {@link navigate}
   */
  rootController: RouteController<any, any, Context> | null = null;

  /**
   * A controller of the intercepted route, or `null` if there's no intercepted route.
   *
   * @see {@link navigate}
   */
  interceptedController: RouteController<any, any, Context> | null = null;

  readonly errorComponent: ComponentType | undefined;
  readonly loadingComponent: ComponentType | undefined;
  readonly notFoundComponent: ComponentType | undefined;

  protected _pubSub = new PubSub<RouterEvent>();
  protected _interceptedLocation: Location | null = null;
  protected _interceptionRegistry = new Map<Route, number>();

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
  }

  /**
   * Looks up a route in {@link routes} that matches a {@link to location}, loads its data and notifies subscribers.
   *
   * @param to A location or a route to navigate to.
   * @param options Navigate options.
   */
  navigate(to: To, options: NavigateOptions = {}): void {
    const location = toLocation(to);
    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);

    let isIntercepted = false;
    let prevController;
    let nextController;

    // Check that the matched route is intercepted
    if (this.rootController !== null && routeMatches.length !== 0 && !options.isInterceptionBypassed) {
      const matchedRoute = routeMatches[routeMatches.length - 1].route;

      for (const route of this._interceptionRegistry.keys()) {
        if (matchedRoute === route) {
          isIntercepted = true;
          break;
        }
      }
    }

    if (isIntercepted) {
      prevController = this.interceptedController?.fallbackController || this.interceptedController;

      this.interceptedController = nextController = reconcileControllers(this, prevController, routeMatches);
      this._interceptedLocation = location;
    } else {
      prevController = this.rootController?.fallbackController || this.rootController;

      this.rootController = nextController = reconcileControllers(this, prevController, routeMatches);
      this._interceptedLocation = this.interceptedController = null;
    }

    this._pubSub.publish({
      type: 'navigate',
      controller: nextController,
      router: this,
      location,
      isIntercepted,
    });

    if (isIntercepted ? this.interceptedController !== nextController : this.rootController !== nextController) {
      // Navigation was superseded
      return;
    }

    // Lookup a controller that requires loading
    for (let controller = nextController; controller !== null; controller = controller.childController) {
      if (this.isSSR && controller.route.renderingDisposition !== 'server') {
        // Cannot load the route and its nested routes on the server
        break;
      }

      if (controller.state.status === 'loading') {
        // Load controller and its descendants
        controller.load();
        break;
      }
    }

    // Abort loading of the replaced controller
    prevController?.abort(AbortError('Router navigation occurred'));
  }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * @param to A location or a route to prefetch.
   * @returns An promise that can be aborted to discard prefetching.
   */
  prefetch(to: To): AbortablePromise<void> {
    return new AbortablePromise((resolve, _reject, signal) => {
      const location = toLocation(to);
      const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);

      resolve(
        Promise.all(
          routeMatches.map(routeMatch =>
            getOrLoadRouteState({
              route: routeMatch.route,
              router: this,
              params: routeMatch.params,
              context: this.context,
              signal,
              isPrefetch: true,
            })
          )
        ).then(noop)
      );
    });
  }

  /**
   * If there's an {@link interceptedController} then it is made a {@link rootController}. No-op otherwise.
   */
  cancelInterception(): void {
    if (this.interceptedController === null) {
      return;
    }

    const location = this._interceptedLocation!;
    this.rootController = this.interceptedController;
    this._interceptedLocation = this.interceptedController = null;

    this._pubSub.publish({
      type: 'navigate',
      controller: this.rootController,
      router: this,
      location,
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
   * Registers a {@link route} as interceptable, so if it is {@link navigate navigated to} it populates
   * the {@link interceptedController} instead of the {@link rootController}.
   *
   * @param route The route to intercept.
   * @returns A callback that discards route interception.
   */
  protected _registerInterceptedRoute(route: Route<any, any, any, Context>): () => void {
    const registry = this._interceptionRegistry;

    registry.set(route, (registry.get(route) || 0) + 1);

    let isDiscarded = false;

    return () => {
      if (isDiscarded) {
        // Can use unregister callback only once
        return;
      }

      isDiscarded = true;

      const registrationCount = registry.get(route);

      if (registrationCount !== 1) {
        registry.set(route, registrationCount! - 1);
        return;
      }

      registry.delete(route);

      const controller = getTailController(this.interceptedController);

      if (controller !== null && !registry.has(controller.route)) {
        this.cancelInterception();
      }
    };
  }
}
