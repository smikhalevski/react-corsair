import { ComponentType } from 'react';
import { loadContent } from './loadContent';
import { matchRoutes } from './matchRoutes';
import { Route } from './Route';
import { Slot } from './SlotManager';
import { RouterOptions, To, Location } from './types';
import { toLocation } from './utils';

/**
 * A router that matches routes with a location.
 *
 * Use {@link createRouter} to create a {@link Router} instance.
 *
 * @template Context A context provided by a {@link Router} to a {@link RouteOptions.loader loader}.
 * @group Routing
 */
export class Router<Context = any> {
  /**
   * A location rendered by a router.
   */
  location: Location | undefined = undefined;

  /**
   * Routes that a router can render.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * A context provided to {@link RouteOptions.loader route loaders}.
   */
  context: Context;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   *
   * A {@link Router}-level {@link errorComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.errorComponent error components}.
   */
  errorComponent: ComponentType | undefined;

  /**
   * A component that is rendered when a {@link RouteOptions.lazyComponent lazyComponent} or
   * a {@link RouteOptions.loader data loader} are being loaded. Render a skeleton or a spinner in this component
   * to notify user that a new route is being loaded.
   *
   * A {@link Router}-level {@link loadingComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.loadingComponent loading components}.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A component that is rendered in the {@link Outlet} if there is no route in {@link routes} that matches
   * the location that the router was navigated to.
   */
  notFoundComponent: ComponentType | undefined;

  /**
   * Slots
   */
  protected _slots: Slot[] | undefined;

  /**
   * Creates a new instance of a {@link Router}.
   *
   * @param options Router options.
   * @template Context A context provided by a {@link Router} to a {@link RouteOptions.loader loader}.
   */
  constructor(options: RouterOptions<Context>) {
    this.routes = options.routes;
    this.context = options.context;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
  }

  navigate(to: To): void {
    const location = toLocation(to);
    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);

    this.location = location;

    if (routeMatches === null) {
      // Not found
      return;
    }

    const slots: Slot[] = [];

    for (const routeMatch of routeMatches) {
      slots.push({
        router: this,
        routeMatch,
        routeContent: loadContent(routeMatch, this.context),
      });
    }

    this._slots = slots;
  }

  /**
   * Prefetches components and data of routes matched by a location.
   *
   * @param to A location or route.
   * @returns `true` if a route was matched, or `false` if there's no route in the router that matches the provided
   * location.
   */
  prefetch(to: To): boolean {
    const location = toLocation(to);
    const routeMatches = matchRoutes(location.pathname, location.searchParams, this.routes);

    if (routeMatches === null) {
      return false;
    }
    for (const routeMatch of routeMatches) {
      loadContent(routeMatch, this.context);
    }
    return true;
  }
}
