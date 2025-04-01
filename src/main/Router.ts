import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { matchRoutes } from './matchRoutes';
import { Route } from './Route';
import { Fallbacks, RouterEvent, RouterOptions, To } from './types';
import { noop, toLocation } from './utils';
import { loadRoute, RoutePresenter } from './RoutePresenter';
import { reconcilePresenters } from './reconcilePresenters';

/**
 * A router that matches routes by a location.
 *
 * @template Context A context provided to {@link RouteOptions.dataLoader route data loaders}.
 * @group Routing
 */
export class Router<Context = any> implements Fallbacks {
  /**
   * Routes that a router can render.
   */
  routes: readonly Route<any, any, any, Context>[];

  /**
   * A context provided to {@link RouteOptions.dataLoader route data loaders}.
   */
  context: Context;

  /**
   * A root presenter rendered in a router {@link Outlet}, or `null` if no route is rendered.
   *
   * @see {@link navigate}
   */
  rootPresenter: RoutePresenter | null = null;

  errorComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

  protected _pubSub = new PubSub<RouterEvent>();

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
   * Looks up a route in {@link routes} that matches a {@link to location}, loads its data and notifies subscribers.
   *
   * @param to A location or a route to navigate to.
   */
  navigate(to: To): void {
    const location = toLocation(to);

    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);
    const rootPresenter = reconcilePresenters(this, routeMatches);

    this.rootPresenter = rootPresenter;

    this._pubSub.publish({ type: 'navigate', router: this, location });

    if (this.rootPresenter !== rootPresenter) {
      // Navigation was superseded
      return;
    }

    for (let presenter = rootPresenter; presenter !== null; presenter = presenter.childPresenter) {
      presenter.reload();
    }
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
          routeMatches.map(routeMatch => loadRoute(routeMatch.route, routeMatch.params, this.context, signal, true))
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
