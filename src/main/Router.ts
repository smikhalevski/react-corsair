import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { matchRoutes, RouteMatch } from './matchRoutes';
import { Route } from './Route';
import { Fallbacks, NavigateOptions, RouteInterceptor, RouterEvent, RouterOptions, To } from './types';
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

  readonly errorComponent: ComponentType | undefined;
  readonly loadingComponent: ComponentType | undefined;
  readonly notFoundComponent: ComponentType | undefined;

  /**
   * A map from an intercepted route to a number of registered interceptors.
   */
  protected _interceptors: RouteInterceptor[] = [];
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
  }

  /**
   * Returns the array of matched routes and extracted params for a given {@link to location}.
   *
   * @param to The location to match.
   */
  match(to: To): RouteMatch[] {
    const location = toLocation(to);
    return matchRoutes(location.pathname, location.searchParams, this.routes);
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

    if (
      !options.isInterceptionBypassed &&
      routeMatches.length !== 0 &&
      this._interceptors.length !== 0 &&
      this._interceptors.some(interceptor => interceptor(routeMatches))
    ) {
      // Navigation was intercepted
      return;
    }

    const prevController = this.rootController?.fallbackController || this.rootController;
    const nextController = reconcileControllers(this, prevController, routeMatches);

    this.rootController = nextController;

    this._pubSub.publish({ type: 'navigate', controller: nextController, router: this, location });

    if (this.rootController !== nextController) {
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
   * Subscribes a listener to events published by a router.
   *
   * @param listener A listener to subscribe.
   * @returns A callback that unsubscribe a listener.
   */
  subscribe(listener: (event: RouterEvent) => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  intercept(interceptor: RouteInterceptor): () => void {
    this._interceptors.push(interceptor);

    return () => {
      this._interceptors.splice(this._interceptors.indexOf(interceptor), 1);
    };
  }
}
