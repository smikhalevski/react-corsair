import React, { Component, createContext, ReactElement, ReactNode, Suspense, useContext } from 'react';
import { NotFoundError } from './notFound';
import { createSuspenseRouteRenderer, matchRoute, Route, RouteMatch } from './Route';
import { Router } from './Router';
import { Location, NavigateOptions } from './types';
import { isArrayEqual } from './utils';

export interface RouterProviderProps<Context> {
  /**
   * The array of routes rendered by the router.
   */
  routes: Route<any>[];

  /**
   * The location to match.
   */
  location: Location;

  /**
   * Triggered when {@link Router.navigate} is called.
   */
  onNavigate: (location: Location, options: NavigateOptions) => void;

  /**
   * Triggered when {@link Router.back} is called.
   */
  onBack?: () => void;

  context?: Context;

  /**
   * Fallback that is rendered if the route component is being fetched.
   */
  pendingFallback?: ReactNode;

  /**
   * Fallback that is rendered if the route that matches the {@link url} wasn't matched by any route, or if
   * {@link notFound} was called during rendering.
   */
  notFoundFallback?: ReactNode;

  /**
   * Fallback that is rendered if an error occurs during route rendering. If `undefined` then an error is re-thrown and
   * must be handled in the enclosing component.
   */
  errorFallback?: ReactNode;

  /**
   * If `true` then pending fallback is always rendered when a route is being loaded.
   *
   * If `false` then the current route is shown when the next route is being loaded. If there's no current route and
   * the next route must be loaded, a pending fallback is rendered.
   *
   * @default false
   */
  isPendingFallbackForced?: boolean;
}

const RouterProviderStateContext = createContext<RouterProviderState | undefined>(undefined);

const RouteMatchContext = createContext<RouteMatch | undefined>(undefined);

export interface RouterProviderState {
  parent: RouterProviderState | null;
  router: Router;
  routes: Route[];
  context?: any;
  location?: Location;
  routeMatch?: RouteMatch;
  renderer?: () => ReactElement;
}

export class RouterProvider<Context> extends Component<RouterProviderProps<Context>, RouterProviderState> {
  /**
   * @hidden
   */
  static contextType = RouterProviderStateContext;

  /**
   * @hidden
   */
  _renderedNode?: ReactNode;

  /**
   * @hidden
   */
  _renderedRouteMatch?: RouteMatch;

  /**
   * @hidden
   */
  static getDerivedStateFromProps(
    props: RouterProviderProps<any>,
    state: RouterProviderState
  ): Partial<RouterProviderState> | null {
    if (
      state.location !== undefined &&
      state.location.pathname === props.location.pathname &&
      state.location.search === props.location.search &&
      state.location.hash === props.location.hash &&
      state.location.state === props.location.state &&
      state.context === props.context &&
      isArrayEqual(state.routes, props.routes)
    ) {
      return null;
    }

    const routeMatch = matchRoute(props.location, props.context, props.routes);

    if (routeMatch === null) {
      return {
        routes: props.routes,
        context: props.context,
        location: props.location,
        routeMatch: undefined,
        renderer: undefined,
      };
    }

    return {
      routes: props.routes,
      context: props.context,
      location: props.location,
      routeMatch,
      renderer: createSuspenseRouteRenderer(routeMatch, props.context),
    };
  }

  /**
   * @hidden
   */
  static getDerivedStateFromError(error: Error): Partial<RouterProviderState> | null {
    return error instanceof NotFoundError ? { renderer: undefined } : null;
  }

  /**
   * @hidden
   */
  constructor(props: RouterProviderProps<Context>, context: RouterProviderState | null) {
    super(props);

    this.state = {
      parent: context,
      router: new Router(this),
      routes: props.routes,
    };
  }

  /**
   * @hidden
   */
  render() {
    return (
      <RouterProviderStateContext.Provider value={this.state}>
        <Suspense
          fallback={
            <RouteProvider
              provider={this}
              isPending={true}
            />
          }
        >
          <RouteProvider
            provider={this}
            isPending={false}
          />
        </Suspense>
      </RouterProviderStateContext.Provider>
    );
  }
}

interface RouteProviderProps {
  provider: RouterProvider<any>;
  isPending: boolean;
}

function RouteProvider({ provider, isPending }: RouteProviderProps): ReactElement {
  const { props, state } = provider;

  if (isPending) {
    if (props.isPendingFallbackForced || provider._renderedNode === undefined) {
      return <RouteMatchContext.Provider value={state.routeMatch}>{props.pendingFallback}</RouteMatchContext.Provider>;
    }
  } else {
    // May suspend rendering until the route is rendered
    provider._renderedNode = state.renderer === undefined ? props.notFoundFallback : state.renderer();
    provider._renderedRouteMatch = state.routeMatch;
  }

  return (
    <RouteMatchContext.Provider value={provider._renderedRouteMatch}>
      {provider._renderedNode}
    </RouteMatchContext.Provider>
  );
}

/**
 * Returns the router that handles navigation.
 */
export function useRouter(): Router {
  useContext(RouteMatchContext);

  const provider = useContext(RouterProviderStateContext);

  if (provider === undefined) {
    throw new Error("RouterProvider isn't rendered");
  }
  return provider.router;
}

/**
 * Returns params associated with the rendered route.
 *
 * **Note:** Throws an {@link !Error} is the route isn't rendered.
 *
 * @param route The route for which params are retrieved.
 */
export function useRouteParams<Params>(route: Route<Params>): Params {
  const match = useContext(RouteMatchContext);

  if (match === undefined || match.route !== route) {
    throw new Error("Cannot retrieve params of the route that isn't rendered");
  }

  return match.locationMatch.params;
}

export function useRouteError(): any {}
