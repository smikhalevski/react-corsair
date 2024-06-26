import React, { Component, createContext, ReactElement, ReactNode, Suspense, useContext } from 'react';
import { NotFoundError } from './notFound';
import { createSuspenseRenderer, matchRoute, Route } from './Route';
import { Router } from './Router';
import { NavigateOptions, SearchParamsParser } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';
import { isArrayEqual } from './utils';

export interface RouterProviderProps {
  /**
   * The URL or pathname of the required route.
   */
  url: string;

  /**
   * The array of routes rendered by the router.
   */
  routes: Route[];

  /**
   * The base URL or pathname.
   */
  base?: string;

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
   * Parses URL search params as an object.
   */
  searchParamsParser?: SearchParamsParser;

  /**
   * Triggered when {@link Router.navigate} is called.
   */
  onNavigate?: (url: string, options: NavigateOptions) => void;

  /**
   * Triggered when {@link Router.back} is called.
   */
  onBack?: () => void;
}

const RouterProviderContext = createContext<RouterProvider | null>(null);

interface RouterProviderState {
  url?: string;
  routes?: Route[];
  parent?: RouterProvider | null;
  route?: Route;
  params?: any;
  renderer?: () => ReactElement;
  searchParamsParser?: SearchParamsParser;
}

export class RouterProvider extends Component<RouterProviderProps, RouterProviderState> {
  static contextType = RouterProviderContext;

  readonly root: RouterProvider;
  readonly router = new Router(this);

  static getDerivedStateFromProps(props: RouterProviderProps, state: RouterProviderState): RouterProviderState | null {
    if (
      props.url === state.url &&
      state.routes !== undefined &&
      isArrayEqual(props.routes, state.routes) &&
      props.searchParamsParser === state.searchParamsParser
    ) {
      return null;
    }

    const searchParamsParser =
      props.searchParamsParser || state.parent?.state.searchParamsParser || urlSearchParamsParser;

    const routeMatch = matchRoute(props.url, props.routes, searchParamsParser);

    if (routeMatch === null) {
      return {
        url: props.url,
        routes: props.routes,
        route: undefined,
        params: undefined,
        renderer: undefined,
        searchParamsParser,
      };
    }

    return {
      url: props.url,
      routes: props.routes,
      route: routeMatch.route,
      params: routeMatch.params,
      renderer: createSuspenseRenderer(routeMatch.route, routeMatch.params),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouterProviderState> | null {
    if (error instanceof NotFoundError) {
      return { renderer: undefined };
    }
    return null;
  }

  constructor(props: RouterProviderProps, context: RouterProvider | null) {
    super(props);

    this.root = context === null ? this : context.root;
    this.state = {
      parent: context,
    };
  }

  render() {
    return (
      <RouterProviderContext.Provider value={this}>
        <Suspense fallback={this.props.pendingFallback}>
          <RouteRenderer provider={this} />
        </Suspense>
      </RouterProviderContext.Provider>
    );
  }
}

function RouteRenderer({ provider }: { provider: RouterProvider }) {
  return provider.state.renderer === undefined ? provider.props.notFoundFallback : provider.state.renderer();
}

export function useRouterProvider(): RouterProvider {
  const provider = useContext(RouterProvider.contextType);

  if (provider === null) {
    throw new Error('RouterProvider must be rendered');
  }
  return provider;
}
