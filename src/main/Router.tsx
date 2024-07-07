import React, { Component, createContext, ReactElement, ReactNode } from 'react';
import { matchRoutes } from './matchRoutes';
import { Navigation } from './Navigation';
import { NextOutletControllerContext, Outlet, OutletController } from './Outlet';
import { Route } from './Route';
import { Location, NavigateOptions } from './types';
import { isArrayEqual } from './utils';

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
   * Triggered when location must be changed.
   */
  onNavigate?: (location: Location, options: NavigateOptions) => void;

  /**
   * Triggered when router should be navigated to the previous location.
   */
  onBack?: () => void;

  /**
   * Children rendered by the router. If omitted, routers renders an {@link Outlet}.
   */
  children?: ReactNode;

  /**
   * A fallback that is rendered if there is no matched nested route.
   */
  notFoundFallback?: ReactNode;
}

export interface NoContextRouterProps extends Omit<RouterProps<void>, 'context'> {}

export function Router<Context>(props: NoContextRouterProps | RouterProps<Context>): ReactElement {
  return (
    <RouterProvider
      context={undefined}
      {...props}
    />
  );
}

export const NavigationContext = createContext<Navigation | null>(null);

NavigationContext.displayName = 'NavigationContext';

export class RouterProvider extends Component<
  RouterProps<any>,
  { routes: Route[]; controller: OutletController | null; routerProvider: RouterProvider }
> {
  static getDerivedStateFromProps(
    props: RouterProps<any>,
    state: RouterProvider['state']
  ): Partial<RouterProvider['state']> | null {
    if (
      state.controller !== null &&
      state.controller.location === props.location &&
      isArrayEqual(state.routes, props.routes)
    ) {
      return null;
    }

    const routeMatches = matchRoutes(props.location.pathname, props.location.searchParams, props.routes);

    console.log(routeMatches);

    if (routeMatches === null) {
      const controller = new OutletController(state.routerProvider, props.location);
      controller.node = props.notFoundFallback;
      return { routes: props.routes, controller };
    }

    let nextController: OutletController | null = null;

    for (let i = routeMatches.length - 1; i >= 0; i--) {
      const controller = new OutletController(state.routerProvider, props.location);
      controller.load(routeMatches[i], props.context);
      controller.next = nextController;
      nextController = controller;
    }

    return { routes: props.routes, controller: nextController };
  }

  navigation;

  constructor(props: RouterProps<any>) {
    super(props);

    this.navigation = new Navigation(this);

    this.state = { routes: props.routes, controller: null, routerProvider: this };
  }

  render() {
    return (
      <NavigationContext.Provider value={this.navigation}>
        <NextOutletControllerContext.Provider value={this.state.controller}>
          {this.props.children === undefined ? <Outlet /> : this.props.children}
        </NextOutletControllerContext.Provider>
      </NavigationContext.Provider>
    );
  }
}
