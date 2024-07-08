import React, { Component, createContext, ReactNode } from 'react';
import { Navigation } from './Navigation';
import { isArrayEqual } from './utils';
import { matchRoutes } from './matchRoutes';
import { NestedOutletControllerContext, Outlet } from './Outlet';
import { OutletController } from './OutletController';
import { Route } from './Route';
import { Location } from './types';

export const NavigationContext = createContext<Navigation | null>(null);

NavigationContext.displayName = 'NavigationContext';

/**
 * Props of the {@link Router} component.
 *
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.dataLoader}.
 */
export interface RouterProps<Context> {
  /**
   * The location rendered by the router.
   */
  location: Location;

  /**
   * Routes that the router can render.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * An arbitrary context provided to {@link RouteOptions.dataLoader}.
   */
  context: Context;

  /**
   * Triggered when a router location must be changed.
   */
  onPush?: (location: Location) => void;

  /**
   * Triggered when a router location must be changed.
   */
  onReplace?: (location: Location) => void;

  /**
   * Triggered when a router should be navigated to the previous location.
   */
  onBack?: () => void;

  /**
   * Children rendered by the router. If `undefined`, then an {@link Outlet} is rendered.
   */
  children?: ReactNode;

  /**
   * A fallback that is rendered in the {@link Outlet} if there is no route in {@link routes} that matches
   * the {@link location}.
   */
  notFoundFallback?: ReactNode;
}

/**
 * Options of a {@link Router} that doesn't provide any context for a {@link RouteOptions.dataLoader}.
 */
export interface NoContextRouterProps extends Omit<RouterProps<void>, 'context'> {}

interface RouterState {
  routes: Route[];
  controller: OutletController | null;
  router: Router<any>;
}

/**
 * A router that renders a route that matches the provided location.
 *
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.dataLoader}.
 */
export class Router<Context = void> extends Component<NoContextRouterProps | RouterProps<Context>, RouterState> {
  /**
   * @internal
   */
  static getDerivedStateFromProps(props: RouterProps<any>, state: RouterState): Partial<RouterState> | null {
    if (
      state.controller !== null &&
      state.controller.location === props.location &&
      isArrayEqual(state.routes, props.routes)
    ) {
      return null;
    }

    const routeMatches = matchRoutes(props.location.pathname, props.location.searchParams, props.routes);

    let controller: OutletController | null = null;

    if (routeMatches === null) {
      controller = new OutletController(props.location);
      controller.node = props.notFoundFallback;

      return {
        routes: props.routes,
        controller,
      };
    }

    for (const routeMatch of routeMatches) {
      const prevController = new OutletController(props.location);
      prevController.load(routeMatch.route, routeMatch.params, props.context);
      prevController.nestedController = controller;
      controller = prevController;
    }

    return {
      routes: props.routes,
      controller: controller,
    };
  }

  private readonly _navigation = new Navigation(this);

  /**
   * @internal
   */
  constructor(props: RouterProps<Context>) {
    super(props);

    this.state = {
      routes: props.routes,
      controller: null,
      router: this,
    };
  }

  /**
   * @internal
   */
  render() {
    return (
      <NavigationContext.Provider value={this._navigation}>
        <NestedOutletControllerContext.Provider value={this.state.controller}>
          {this.props.children === undefined ? <Outlet /> : this.props.children}
        </NestedOutletControllerContext.Provider>
      </NavigationContext.Provider>
    );
  }
}
