import React, { Component, ComponentType, createContext, ReactNode } from 'react';
import { createNavigation } from './createNavigation';
import { hydrateRoutes, loadRoutes, SSRRoutePayload } from './loadRoutes';
import { matchRoutes, RouteMatch } from './matchRoutes';
import { Outlet } from './Outlet';
import { Route } from './Route';
import { SlotControllerContext } from './Slot';
import { NotFoundSlotController, RouteSlotController, SlotController } from './SlotController';
import { Location } from './types';
import { isArrayEqual } from './utils';

export const RouterContext = createContext<Router<any> | null>(null);

RouterContext.displayName = 'RouterContext';

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

  /**
   * How a router is affiliated to SSR:
   *
   * <dl>
   * <dt>"client"</dt>
   * <dd>When a location is matched for the first time by a router, the latter tries to hydrate data from a global
   * SSR state. Used by default when {@link !window} is defined.</dd>
   * <dt>"server"</dt>
   * <dd>A router renders hydration chunks to populate a global SSR state on the client. Used by default when
   * {@link !window} is `undefined`.</dd>
   * <dt>"none"</dt>
   * <dd>A router doesn't participate in SSR.</dd>
   * </dl>
   */
  ssrAffiliation?: 'client' | 'server' | 'none';

  /**
   * Parses a payload that was stringified during SSR.
   *
   * Provide this option on the client when {@link ssrAffiliation SSR is enabled}.
   *
   * @param payloadStr A stringified payload to parse.
   * @default JSON.parse
   */
  payloadParser?: (payloadStr: string) => SSRRoutePayload;

  /**
   * Stringifies a route payload during SSR.
   *
   * Provide this option on the server when {@link ssrAffiliation SSR is enabled}.
   *
   * @param payload A route payload to stringify.
   * @default JSON.stringify
   */
  payloadStringifier?: (payload: SSRRoutePayload) => string;

  /**
   * A [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
   * nonce that should be also passed as `script-src` directive in an HTTP header.
   */
  nonce?: string;
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
  location: Partial<Location> | null;
  routes: Route[];
  slotControllers: SlotController[];
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
  static defaultProps: Partial<NoContextRouterProps> = {
    ssrAffiliation: typeof window === 'undefined' ? 'server' : 'client',
  };

  /**
   * @internal
   */
  readonly navigation = createNavigation(this);

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
      slotControllers: createSlotControllers(state.slotControllers, routeMatches, props),
    };
  }

  /**
   * @internal
   */
  constructor(props: RouterProps<Context>) {
    super(props);

    this.state = {
      location: null,
      routes: props.routes,
      slotControllers: [],
    };
  }

  /**
   * @internal
   */
  render() {
    const controller = this.state.slotControllers[0];

    return (
      <RouterContext.Provider value={this}>
        <SlotControllerContext.Provider value={controller}>
          {this.props.ssrAffiliation === 'server' && controller instanceof RouteSlotController && (
            <script
              nonce={this.props.nonce}
              dangerouslySetInnerHTML={{
                __html:
                  'window.__REACT_CORSAIR_SSR_STATE__=new Map();' +
                  'var e=document.currentScript;e&&e.parentNode.removeChild(e);',
              }}
            />
          )}
          {this.props.children === undefined ? <Outlet /> : this.props.children}
        </SlotControllerContext.Provider>
      </RouterContext.Provider>
    );
  }
}

export function createSlotControllers(
  prevControllers: SlotController[],
  routeMatches: RouteMatch[] | null,
  routerProps: RouterProps<any>
): SlotController[] {
  const { context, errorComponent, loadingComponent, notFoundComponent } = routerProps;

  if (routeMatches === null) {
    // Not found
    return [new NotFoundSlotController(routerProps)];
  }

  const routePayloads =
    hydrateRoutes(routeMatches, routerProps.payloadParser || JSON.parse) || loadRoutes(routeMatches, context);

  const slotControllers: RouteSlotController[] = [];

  // Matched a route
  for (let i = routeMatches.length; i-- > 0; ) {
    slotControllers[i] = new RouteSlotController(prevControllers[i], {
      childController: slotControllers[i + 1],
      index: i,
      routeMatch: routeMatches[i],
      routePayload: routePayloads[i],
      payloadStringifier:
        routerProps.ssrAffiliation === 'server' ? routerProps.payloadStringifier || JSON.stringify : undefined,
      nonce: routerProps.nonce,
      errorComponent: i === 0 ? errorComponent : undefined,
      loadingComponent: i === 0 ? loadingComponent : undefined,
      notFoundComponent: i === 0 ? notFoundComponent : undefined,
    });
  }

  return slotControllers;
}
