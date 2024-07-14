import React, { Component, ComponentType, ReactNode } from 'react';
import { deriveSlotContent } from './deriveSlotContent';
import { matchRoutes } from './matchRoutes';
import { Navigation } from './Navigation';
import { NotFoundSlotContent } from './NotFoundSlotContent';
import { Outlet } from './Outlet';
import { Route } from './Route';
import { ChildSlotContentContext, SlotContent } from './Slot';
import { Location } from './types';
import { NavigationContext } from './useNavigation';
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
  location: Location;

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
   * A component that is rendered when a {@link RouteOptions.lazyComponent} or {@link RouteOptions.loader} are being
   * loaded. Render a skeleton or a spinner in this component to notify user that a new route is being loaded.
   *
   * The {@link Router}-level {@link loadingComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.loadingComponent}.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   *
   * The {@link Router}-level {@link errorComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.errorComponent}.
   */
  errorComponent?: ComponentType;

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
  location: Location | null;
  routes: Route[];
  content: SlotContent | undefined;
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

    const routeMatches = matchRoutes(props.location.pathname, props.location.searchParams, props.routes);

    return {
      location: props.location,
      routes: props.routes,
      content:
        routeMatches === null
          ? new NotFoundSlotContent(props.notFoundComponent, props)
          : deriveSlotContent(state.content, routeMatches, props),
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
      content: undefined,
    };
  }

  /**
   * @internal
   */
  render() {
    return (
      <NavigationContext.Provider value={this.state.navigation}>
        <ChildSlotContentContext.Provider value={this.state.content}>
          {this.props.children === undefined ? <Outlet /> : this.props.children}
        </ChildSlotContentContext.Provider>
      </NavigationContext.Provider>
    );
  }
}
