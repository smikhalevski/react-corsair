import React, { Component, ComponentType, ReactNode } from 'react';
import { matchRoutes, RouteMatch } from './matchRoutes';
import { Navigation } from './Navigation';
import { Outlet } from './Outlet';
import { Route } from './Route';
import { Location } from './types';
import { NavigationContext } from './useNavigation';
import { SlotValueContext } from './Slot';
import { SlotValue } from './SlotValue';
import { isArrayEqual } from './utils';

/**
 * Props of the {@link Router} component.
 *
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
 */
export interface RouterProps<Context> {
  /**
   * The location rendered by the router.
   */
  location: Partial<Location>;

  /**
   * Routes that the router can render.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * An arbitrary context provided to {@link RouteOptions.loader}.
   */
  context: Context;

  /**
   * Triggered when a new location must be added to a history stack.
   */
  onPush?: (location: Location) => void;

  /**
   * Triggered when a new location must replace the current history entry.
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
   * A component that is rendered when an error was thrown during route rendering.
   *
   * The {@link Router}-level {@link errorComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.errorComponent}.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link RouteOptions.lazyComponent} or {@link RouteOptions.loader} are being
   * loaded. Render a skeleton or a spinner in this component to notify user that a new route is being loaded.
   *
   * The {@link Router}-level {@link loadingComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.loadingComponent}.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered in the {@link Outlet} if there is no route in {@link routes} that matches
   * the {@link location}.
   */
  notFoundComponent?: ComponentType;
}

/**
 * Options of a {@link Router} that doesn't provide any context for a {@link RouteOptions.loader}.
 */
interface NoContextRouterProps extends Omit<RouterProps<void>, 'context'> {
  /**
   * An arbitrary context provided to {@link RouteOptions.loader}.
   */
  context?: undefined;
}

interface RouterState {
  navigation: Navigation;
  location: Partial<Location> | null;
  routes: Route[];
  slotValues: SlotValue[];
}

/**
 * A router that renders a route that matches the provided location.
 *
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
 */
export class Router<Context = void> extends Component<NoContextRouterProps | RouterProps<Context>, RouterState> {
  /**
   * @internal
   */
  static displayName = 'Router';

  /**
   * @internal
   */
  static getDerivedStateFromProps(props: RouterProps<unknown>, state: RouterState): Partial<RouterState> | null {
    if (state.location === props.location && isArrayEqual(state.routes, props.routes)) {
      return null;
    }

    const { pathname = '/', searchParams = {} } = props.location;

    const routeMatches = matchRoutes(pathname, searchParams, props.routes);

    return {
      location: props.location,
      routes: props.routes,
      slotValues: createSlotValues(state.slotValues, routeMatches, props),
    };
  }

  /**
   * @internal
   */
  constructor(props: RouterProps<Context>) {
    super(props);

    this.state = {
      navigation: new Navigation(this),
      location: null,
      routes: props.routes,
      slotValues: [],
    };
  }

  /**
   * @internal
   */
  render() {
    return (
      <NavigationContext.Provider value={this.state.navigation}>
        <SlotValueContext.Provider value={this.state.slotValues[0]}>
          {this.props.children === undefined ? <Outlet /> : this.props.children}
        </SlotValueContext.Provider>
      </NavigationContext.Provider>
    );
  }
}

export function createSlotValues(
  oldSlotValues: SlotValue[],
  routeMatches: RouteMatch[] | null,
  routerProps: RouterProps<any>
): SlotValue[] {
  const { context, errorComponent, loadingComponent, notFoundComponent } = routerProps;

  if (routeMatches === null) {
    // Not found
    return [
      new SlotValue({
        errorComponent,
        loadingComponent,
        notFoundComponent,
      }),
    ];
  }

  const slotValues: SlotValue[] = [];

  // Matched a route
  for (let i = routeMatches.length; i-- > 0; ) {
    const route = routeMatches[i].route;

    slotValues[i] = new SlotValue({
      oldValue: oldSlotValues[i],
      childValue: slotValues[i + 1],
      route,
      params: routeMatches[i].params,
      context,
      errorComponent: i === 0 ? errorComponent : undefined,
      loadingComponent: i === 0 ? loadingComponent : undefined,
      notFoundComponent: i === 0 ? notFoundComponent : undefined,
    });
  }

  return slotValues;
}
