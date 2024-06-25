import React, { Component, createContext, ReactNode, Suspense, useContext } from 'react';
import { matchRoute, RouteMatch } from './matchRoute';
import { Route } from './Route';
import { Router } from './Router';
import { NavigateOptions, SearchParamsParser } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';
import { isPromiseLike } from './utils';

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
   * The component that is rendered if the route component and data are being loaded.
   */
  pendingFallback?: ReactNode;

  /**
   * Component that is rendered if the route that matches the {@link url URL} wasn't found.
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
   * Triggered when {@link redirect} is called during rendering.
   */
  onRedirect?: (url: string) => void;

  /**
   * Triggered when {@link Router.back} is called.
   */
  onBack?: () => void;
}

const RouterProviderContext = createContext<RouterProvider | null>(null);

export class RouterProvider extends Component<RouterProviderProps> {
  static contextType = RouterProviderContext;

  root: RouterProvider;
  parent: RouterProvider | null;
  routeMatch: RouteMatch | null = null;
  pendingRouteMatch: RouteMatch | null = null;
  base;
  searchParamsParser;
  router = new Router(this);
  renderedNode: ReactNode | undefined = undefined;
  onNavigate;
  onRedirect;
  onBack;
  isNotFound = false;

  constructor(props: RouterProviderProps, context: RouterProvider | null) {
    super(props);

    this.root = context === null ? this : context.root;
    this.parent = context;
    this.base = props.base || '';
    this.searchParamsParser = props.searchParamsParser || urlSearchParamsParser;
    this.onNavigate = props.onNavigate;
    this.onRedirect = props.onRedirect;
    this.onBack = props.onBack;
  }

  onNotFound() {
    this.isNotFound = true;
    // throw new NotFoundError();
  }

  componentDidCatch(error: Error): void {
    //   if (error instanceof NotFoundError) {
    //     return;
    //   }
    //   throw error;
  }

  // UNSAFE_componentWillReceiveProps(nextProps: Readonly<RouterProviderProps>) {
  //   this.isNotFound &&= this.props.url === nextProps.url;
  // }

  render() {
    return (
      <RouterProviderContext.Provider value={this}>
        <Suspense fallback={this.renderedNode || this.props.pendingFallback}>
          <RouteRenderer provider={this} />
        </Suspense>
      </RouterProviderContext.Provider>
    );
  }
}

function RouteRenderer({ provider }: { provider: RouterProvider }) {
  const { props } = provider;
  const routeMatch = provider.isNotFound ? null : matchRoute(props.url, props.routes, props.searchParamsParser);

  // if routeMatch.route is unchanged && url is unchanged && searchParamsParser is unchanged then return the previous renderedNode
  const renderedNode = routeMatch === null ? props.notFoundFallback : routeMatch.route['_renderer'](routeMatch.params);

  if (isPromiseLike(renderedNode)) {
    provider.pendingRouteMatch = routeMatch;
    throw renderedNode;
  }

  provider.routeMatch = routeMatch;
  provider.pendingRouteMatch = null;
  provider.renderedNode = renderedNode;

  return renderedNode;
}

export function useRouterProvider(): RouterProvider {
  const provider = useContext(RouterProvider.contextType);

  if (provider === null) {
    throw new Error('RouterProvider must be rendered');
  }
  return provider;
}
