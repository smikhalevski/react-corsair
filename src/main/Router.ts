import { PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { loadRoute } from './loadRoute';
import { matchRoutes, RouteMatch } from './matchRoutes';
import { Route } from './Route';
import { Fallbacks, RouterOptions, To } from './types';
import { Presenter, reconcilePresenters } from './Presenter';
import { toLocation } from './utils';

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
  routes: readonly Route<any, any, any, Context>[];

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

  protected _pubSub = new PubSub();

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
    this.presenters = reconcilePresenters(this, this.presenters, this.match(to));
    this._pubSub.publish();
  }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * @param to A location or a route to prefetch.
   */
  prefetch(to: To): void {
    for (const routeMatch of this.match(to)) {
      loadRoute(routeMatch.route, {
        params: routeMatch.params,
        context: this.context,
        isPreload: true,
      });
    }
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}
