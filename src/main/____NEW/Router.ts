import { ComponentType } from 'react';
import { loadRoute } from './loadRoute';
import { matchRoutes, RouteMatch } from './__matchRoutes';
import { Route } from './__Route';
import { Slot } from './Slot';
import { RouterOptions, To } from './types';
import { toLocation } from './utils';

/**
 * A router that matches routes with a location.
 *
 * Use {@link createRouter} to create a {@link Router} instance.
 *
 * @template Context A context provided to {@link RouteOptions.loader route loaders}.
 * @group Routing
 */
export class Router<Context = any> {
  /**
   * Routes that a router can render.
   */
  routes: readonly Route<any, any, any, Context>[];

  /**
   * A context provided to {@link RouteOptions.loader route loaders}.
   */
  context: Context;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   */
  errorComponent: ComponentType | undefined;

  /**
   * A component that is rendered when a component or data are being loaded.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A component that is rendered in the {@link Outlet} if there is no route in {@link routes} that matches
   * the location that the router was navigated to.
   */
  notFoundComponent: ComponentType | undefined;

  /**
   * A slot that is rendered in the immediate router {@link Outlet}.
   */
  slot: Slot | undefined;

  /**
   * Creates a new instance of a {@link Router}.
   *
   * @param options Router options.
   * @template Context A context provided to {@link RouteOptions.loader route loaders}.
   */
  constructor(options: RouterOptions<Context>) {
    this.routes = options.routes;
    this.context = options.context;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
  }

  match(to: To): RouteMatch[] {
    const location = toLocation(to);
    return matchRoutes(location.pathname, location.searchParams, this.routes);
  }

  // navigate(to: To): void {
  //   const slots: Slot[] = [];
  //
  //   for (const routeMatch of this.match(to)) {
  //     slots.push({
  //       router: this,
  //       routeMatch,
  //       routeContent: loadRoute(routeMatch, this.context),
  //     });
  //   }
  //
  //   this._slots = slots;
  // }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * @param to A location or a route.
   */
  prefetch(to: To): void {
    for (const routeMatch of this.match(to)) {
      loadRoute(routeMatch, this.context);
    }
  }
}
