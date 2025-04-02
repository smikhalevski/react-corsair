import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { matchRoutes } from './matchRoutes';
import { Route } from './Route';
import { Fallbacks, Location, RouterEvent, RouterOptions, To } from './types';
import { noop, toLocation } from './utils';
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
   * The last location this router was navigated to, or `null` if {@link navigate navigation} didn't occur yet.
   */
  location: Location | null = null;

  /**
   * A root controller rendered in a router {@link react-corsair!Outlet}, or `null` if there's no matching route or if
   * {@link navigate navigation} didn't occur yet.
   *
   * @see {@link navigate}
   */
  rootController: RouteController<any, any, Context> | null = null;

  errorComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

  protected _pubSub = new PubSub<RouterEvent>();

  /**
   * Creates a new instance of a {@link react-corsair!Router}.
   *
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: RouterOptions<Context>) {
    this.routes = options.routes;
    this.context = options.context;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
  }

  /**
   * Looks up a route in {@link routes} that matches a {@link to location}, loads its data and notifies subscribers.
   *
   * @param to A location or a route to navigate to.
   */
  navigate(to: To): void {
    const location = toLocation(to);
    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);
    const prevRootController = this.rootController;
    const nextRootController = reconcileControllers(this, routeMatches);

    this.rootController = nextRootController;
    this.location = location;

    this._pubSub.publish({ type: 'navigate', controller: nextRootController, router: this, location });

    if (this.rootController !== nextRootController) {
      // Navigation was superseded
      return;
    }

    // Lookup a controller that requires loading
    for (let controller = nextRootController; controller !== null; controller = controller.childController) {
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

    // Abort loading of the previous navigation
    prevRootController?.abort();
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
}
