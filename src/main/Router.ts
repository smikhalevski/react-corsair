import { AbortablePromise, PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { loadRoute } from './__loadRoute';
import { matchRoutes, RouteMatch } from './__matchRoutes';
import { Route } from './__Route';
import { Fallbacks, Location, RouterOptions, To } from './__types';
import { noop, toLocation } from './__utils';
import { Presenter, reconcilePresenters } from './Presenter';

/**
 * An event dispatched by a {@link Router} when a navigation occurs.
 *
 * @group Routing
 */
export interface NavigateEvent {
  type: 'navigate';

  /**
   * A location to which a router has navigated.
   */
  location: Location;
}

/**
 * An event dispatched by a {@link Router} when a redirect was requested by a router.
 *
 * @group Routing
 */
export interface RedirectEvent {
  type: 'redirect';

  /**
   * A location or a URL to which a redirect should be made.
   */
  to: To | string;
}

/**
 * An event dispatched by a {@link Router}.
 *
 * @group Routing
 */
export type RouterEvent = NavigateEvent | RedirectEvent;

/**
 * A router that matches routes by a location.
 *
 * @template Context A context provided to {@link RouteOptions.loader route loaders}.
 * @group Routing
 */
export class Router<Context = any> implements Fallbacks {
  /**
   * Routes that a router can render.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * A context provided to {@link RouteOptions.loader route loaders}.
   */
  context: Context;

  /**
   * Presenters that provide components for {@link Outlet outlets} to render.
   */
  presenters: Presenter[];

  errorComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

  protected _pubSub = new PubSub<RouterEvent>();

  /**
   * Creates a new instance of a {@link Router}.
   *
   * @param options Router options.
   * @template Context A context provided to {@link RouteOptions.loader route loaders}.
   */
  constructor(options: RouterOptions<Context>) {
    this.routes = options.routes;
    this.context = options.context;
    this.presenters = reconcilePresenters(this, [], []);
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

  navigate(to: To): void {
    const location = toLocation(to);

    this.presenters = reconcilePresenters(
      this,
      this.presenters,
      matchRoutes(location.pathname, location.searchParams, this.routes)
    );

    this._pubSub.publish({ type: 'navigate', location });
  }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * @param to A location or a route to prefetch.
   * @returns An promise that can be aborted is prefetch must be discarded.
   */
  prefetch(to: To): AbortablePromise<void> {
    return new AbortablePromise((resolve, _reject, signal) => {
      const routePayloads = this.match(to).map(routeMatch =>
        loadRoute(routeMatch.route, {
          params: routeMatch.params,
          context: this.context,
          signal,
          isPreload: true,
        })
      );

      resolve(Promise.all(routePayloads).then(noop));
    });
  }

  /**
   * Subscribes a listener to events dispatched by a router.
   *
   * @param listener A listener to subscribe.
   * @returns A callback that unsubscribe a listener.
   */
  subscribe(listener: (event: RouterEvent) => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}
