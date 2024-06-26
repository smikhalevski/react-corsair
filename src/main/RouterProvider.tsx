import React, { Component, createContext, ReactElement, ReactNode, Suspense, useContext } from 'react';
import { NotFoundError } from './notFound';
import { createSuspenseRenderer, matchRoute, Route } from './Route';
import { Router } from './Router';
import { NavigateOptions, RawParams, RouteMatch, SearchParamsParser } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';
import { isArrayEqual } from './utils';

export interface RouterProviderProps {
  /**
   * The array of routes rendered by the router.
   */
  routes: Route<any>[];

  /**
   * The URL or pathname of the required route.
   */
  url?: string;

  /**
   * The base URL or pathname.
   */
  base?: string;

  /**
   * Parses URL search params as an object.
   */
  searchParamsParser?: SearchParamsParser;

  /**
   * Fallback that is rendered if the route component is being fetched.
   */
  pendingFallback?: ReactNode;

  /**
   * If `true` then pending fallback is always rendered when a route is being loaded.
   *
   * If `false` then the current route is shown when the next route is being loaded. If there's no current route and
   * the next route must be loaded, a pending fallback is rendered.
   *
   * @default false
   */
  isPendingFallbackForced?: boolean;

  /**
   * Fallback that is rendered if the route that matches the {@link url} wasn't matched by any route, or if
   * {@link notFound} was called during rendering.
   */
  notFoundFallback?: ReactNode;

  /**
   * Triggered when {@link Router.navigate} is called.
   */
  onNavigate?: (url: string, options: NavigateOptions) => void;

  /**
   * Triggered when {@link Router.back} is called.
   */
  onBack?: () => void;
}

const RouterProviderStateContext = createContext<RouterProviderState | undefined>(undefined);

const RouteMatchContext = createContext<RouteMatch | undefined>(undefined);

export interface RouterProviderState {
  parent: RouterProviderState | null;
  router: Router;
  routes: Route[];
  routeMatch?: RouteMatch;
  renderer?: () => ReactElement;
  searchParamsParser?: SearchParamsParser;
  url?: {
    pathname: string;
    search: string;
    searchParams: RawParams;
    hash: string;
  };
}

export class RouterProvider extends Component<RouterProviderProps, RouterProviderState> {
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
    props: RouterProviderProps,
    state: RouterProviderState
  ): Partial<RouterProviderState> | null {
    const { base, routes } = props;
    const { parent } = state;

    const searchParamsParser = props.searchParamsParser || parent?.searchParamsParser || urlSearchParamsParser;

    let pathname;
    let search;
    let searchParams;
    let hash;

    if (props.url !== undefined) {
      pathname = props.url;

      if (base !== undefined) {
        if (!pathname.startsWith(base)) {
          return {
            routes,
            routeMatch: undefined,
            renderer: undefined,
            searchParamsParser,
            url: undefined,
          };
        }

        pathname = pathname.substring(0, base.length);
      }

      const url = new URL(pathname, 'http://undefined');

      pathname = url.pathname;
      search = url.search;
      searchParams = searchParamsParser.parse(search);
      hash = url.hash;
    } else if (parent?.url !== undefined && parent.routeMatch?.nestedPathname !== undefined) {
      pathname = parent.routeMatch.nestedPathname;

      if (base !== undefined) {
        if (!pathname.startsWith(base)) {
          return {
            routes,
            routeMatch: undefined,
            renderer: undefined,
            searchParamsParser,
            url: undefined,
          };
        }

        pathname = pathname.substring(0, base.length);
      }

      search = parent.url.search;
      searchParams = parent.url.searchParams;
      hash = parent.url.hash;

      if (props.searchParamsParser !== undefined) {
        searchParams = props.searchParamsParser.parse(parent.url.search);
      }
    } else {
      throw new Error('Cannot infer the URL to render');
    }

    if (
      state.url !== undefined &&
      state.url.pathname === pathname &&
      state.url.search === search &&
      state.searchParamsParser === searchParamsParser &&
      isArrayEqual(state.routes, props.routes)
    ) {
      return null;
    }

    const url = {
      pathname,
      search,
      searchParams,
      hash,
    };

    const routeMatch = matchRoute(pathname, searchParams, routes);

    if (routeMatch === null) {
      return {
        routes,
        routeMatch: undefined,
        renderer: undefined,
        searchParamsParser,
        url,
      };
    }

    return {
      routes,
      routeMatch,
      renderer: createSuspenseRenderer(routeMatch.route, routeMatch.params),
      searchParamsParser,
      url,
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
  constructor(props: RouterProviderProps, context: RouterProviderState | null) {
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
  provider: RouterProvider;
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

  return match.params;
}
