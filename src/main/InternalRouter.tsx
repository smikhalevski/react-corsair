import React, { Component } from 'react';
import { createNavigation } from './createNavigation';
import { matchRoutes, RouteMatch } from './matchRoutes';
import { Outlet } from './Outlet';
import { Route } from './Route';
import { RouterProps } from './Router';
import { ChildSlotControllerContext } from './Slot';
import { LoadingSlotController, NotFoundSlotController, RouteSlotController, SlotController } from './SlotController';
import { Location } from './types';
import { InternalRouterContext } from './useInternalRouter';
import { hydrateRoutes, loadServerRoutes, RouterHydrationScript } from './content-loaders';
import { isArrayEqual } from './utils';

interface InternalRouterProps extends Omit<RouterProps<void>, 'context'> {
  routerId: string;
  context?: undefined;
}

interface InternalRouterState {
  location: Partial<Location> | null;
  routes: Route[];
  slotControllers: SlotController[];
  isServer: boolean;
}

export class InternalRouter extends Component<InternalRouterProps, InternalRouterState> {
  static displayName = 'InternalRouter';

  readonly navigation = createNavigation(this);

  static getDerivedStateFromProps(
    props: InternalRouterProps,
    state: InternalRouterState
  ): Partial<InternalRouterState> | null {
    if (state.location === props.location && isArrayEqual(state.routes, props.routes)) {
      return null;
    }

    const { pathname = '/', searchParams = {} } = props.location;

    const routeMatches = matchRoutes(pathname, searchParams, props.routes);

    return {
      location: props.location,
      routes: props.routes,
      slotControllers: createSlotControllers(state.slotControllers, routeMatches, props, state.isServer),
    };
  }

  constructor(props: InternalRouterProps) {
    super(props);

    this.state = {
      location: null,
      routes: props.routes,
      slotControllers: [],
      isServer: typeof window === 'undefined',
    };
  }

  render() {
    const controller = this.state.slotControllers[0];

    return (
      <InternalRouterContext.Provider value={this}>
        <ChildSlotControllerContext.Provider value={controller}>
          {this.state.isServer && controller instanceof RouteSlotController && <RouterHydrationScript />}
          {this.props.children === undefined ? <Outlet /> : this.props.children}
        </ChildSlotControllerContext.Provider>
      </InternalRouterContext.Provider>
    );
  }
}

export function createSlotControllers(
  prevControllers: SlotController[],
  routeMatches: RouteMatch[] | null,
  routerProps: InternalRouterProps,
  isServer: boolean
): SlotController[] {
  if (routeMatches === null) {
    // Not found
    return [new NotFoundSlotController(routerProps)];
  }

  const routeContents = isServer
    ? loadServerRoutes(routeMatches, routerProps.context)
    : hydrateRoutes(routerProps.routerId, routeMatches, routerProps.context, routerProps.stateParser);

  const slotControllers: SlotController[] = [];

  // Matched a route
  for (let i = 0; i < routeContents.length; ++i) {
    slotControllers.push(
      new RouteSlotController(prevControllers[i], {
        index: i,
        routeMatch: routeMatches[i],
        routeContent: routeContents[i],
        errorComponent: i === 0 ? routerProps.errorComponent : undefined,
        loadingComponent: i === 0 ? routerProps.loadingComponent : undefined,
        notFoundComponent: i === 0 ? routerProps.notFoundComponent : undefined,
        onRedirect: redirect => routerProps.onRedirect?.(redirect),
      })
    );
  }

  if (isServer && slotControllers.length !== routeMatches.length) {
    // Client-only routes aren't rendered on the server
    const { route } = routeMatches[slotControllers.length];

    slotControllers.push(
      new LoadingSlotController(
        slotControllers.length === 0 ? route.loadingComponent || routerProps.loadingComponent : route.loadingComponent
      )
    );
  }

  // Parent-child relationships
  for (let i = 1; i < slotControllers.length; ++i) {
    slotControllers[i - 1].childController = slotControllers[i];
  }

  return slotControllers;
}
