import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { loadRoute } from './loadRoute';
import { matchRoutes, RouteMatch } from './matchRoutes';
import { Route } from './Route';
import { FallbackOptions, RouterEvent, RouterOptions, To } from './types';
import { noop, toLocation } from './utils';
import { RouteManager } from './RouteManager';
import { reconcileRouteManagers } from './reconcileRouteManagers';

/**
 * A router that matches routes by a location.
 *
 * @template Context A context provided to {@link RouteOptions.dataLoader route data loaders}.
 * @group Routing
 */
export class Router<Context = any> implements FallbackOptions {
  /**
   * Routes that a router can render.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * A context provided to {@link RouteOptions.dataLoader route data loaders}.
   */
  context: Context;

  /**
   * A manager rendered in a router {@link Outlet}, or `null` if no route is rendered.
   *
   * @see {@link navigate}
   */
  routeManager: RouteManager<Context> | null = null;

  errorComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

  protected _pubSub = new PubSub<RouterEvent<Context>>();

  /**
   * Creates a new instance of a {@link Router}.
   *
   * @param options Router options.
   * @template Context A context provided to {@link RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: RouterOptions<Context>) {
    this.routes = options.routes;
    this.context = options.context;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
  }

  /**
   * Looks up a route in {@link routes} that matches a location, and returns an array of matches for a route and its
   * ancestors.
   *
   * @param to A location or a route to match.
   */
  match(to: To): RouteMatch[] {
    const location = toLocation(to);

    return matchRoutes(location.pathname, location.searchParams, this.routes);
  }

  /**
   * Looks up a route in {@link routes} that matches a {@link to location}, loads its data and notifies subscribers.
   *
   * @param to A location or a route to navigate to.
   */
  navigate(to: To): void {
    const location = toLocation(to);

    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);
    const routeManager = reconcileRouteManagers(this, routeMatches);

    for (let manager = routeManager; manager !== null; manager = manager.childManager) {
      if (manager.state.status === 'loading' && manager.promise === null) {
        manager.reload();
      }
    }

    this.routeManager = routeManager;

    this._pubSub.publish({ type: 'navigate', router: this, location });
  }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * @param to A location or a route to prefetch.
   * @returns An promise that can be aborted to discard prefetching.
   */
  prefetch(to: To): AbortablePromise<void> {
    return new AbortablePromise((resolve, _reject, signal) => {
      resolve(
        Promise.all(this.match(to).map(routeMatch => loadRoute(routeMatch, this.context, signal, true))).then(noop)
      );
    });
  }

  /**
   * Subscribes a listener to events dispatched by a router.
   *
   * @param listener A listener to subscribe.
   * @returns A callback that unsubscribe a listener.
   */
  subscribe(listener: (event: RouterEvent<Context>) => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}
