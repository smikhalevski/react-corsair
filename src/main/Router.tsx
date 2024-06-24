import React, {
  Component,
  ComponentType,
  createContext,
  createElement,
  ReactElement,
  Suspense,
  useContext,
} from 'react';
import { matchRoute, RouteMatch } from './matchRoute';
import { type Route, SearchParamsParser } from './types';
import { isPromiseLike } from './utils';

export interface NavigateOptions {
  /**
   * The arbitrary navigation state, that can be passed to {@link !History.state}.
   */
  state?: any;

  /**
   * If `true` then navigation should replace the current history entry.
   *
   * @default false
   */
  replace?: boolean;
}

export interface Router {
  /**
   * The currently active route, or `null` in the {@link RouterProviderProps.notFoundComponent}.
   */
  route: Route<any> | null;

  /**
   * `true` if the router is currently loading the component or data.
   */
  isPending: boolean;

  /**
   * Navigates the router to the given route.
   */
  navigate<Params>(route: Route<Params>, params: Params, options?: NavigateOptions): void;

  /**
   * Navigates to the previous route.
   */
  back(): void;

  /**
   * Returns the URL of the route that starts with {@link RouterProps.base the router base}.
   */
  getURL<Params>(route: Route<Params>, params: Params): string;
}

export interface RouterProviderProps {
  /**
   * The URL or pathname of the required route.
   */
  url: string;

  /**
   * The array of routes rendered by the router.
   */
  routes: Route<any>[];

  /**
   * The base URL or pathname.
   */
  base?: string;

  /**
   * The component that is rendered if the route component and data are being loaded.
   */
  pendingComponent?: ComponentType;

  /**
   * Component that is rendered if the route that matches the {@link url URL} wasn't found.
   */
  notFoundComponent?: ComponentType;

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

export class RouterProvider extends Component<RouterProviderProps> {
  router: Router = {
    route: null,
    isPending: false,
    navigate: (route, params, options) => {},
    back: () => {},
    getURL: (route, params) => {
      return '';
    },
  };

  routeMatch: RouteMatch | null = null;
  prevElement: ReactElement | null = null;

  constructor(props: RouterProviderProps) {
    super(props);
  }

  componentDidCatch(error: Error): void {}

  render() {
    return (
      <RouterProviderContext.Provider value={this}>
        <Suspense fallback={this.prevElement || createElementOrNull(this.props.pendingComponent)}>
          <RouteRenderer provider={this} />
        </Suspense>
      </RouterProviderContext.Provider>
    );
  }
}

function RouteRenderer({ provider }: { provider: RouterProvider }) {
  provider.routeMatch = matchRoute(provider.props.url, provider.props.routes, provider.props.searchParamsParser);

  if (provider.routeMatch === null) {
    return (provider.prevElement = createElementOrNull(provider.props.notFoundComponent));
  }

  // if routeMatch.route is unchanged && url is unchanged && searchParamsParser is unchanged then return the previous element

  const element = provider.routeMatch.route.renderer(provider.routeMatch.params);

  if (isPromiseLike(element)) {
    throw element;
  }

  return (provider.prevElement = element);
}

function createElementOrNull(component: ComponentType | undefined): ReactElement | null {
  return component !== undefined ? createElement(component) : null;
}

const RouterProviderContext = createContext<RouterProvider | null>(null);

export function useRouter(): Router {
  const manager = useContext(RouterProviderContext);

  if (manager === null) {
    throw new Error('Expected enclosing RouterProvider');
  }
  return manager.router;
}
