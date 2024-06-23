import React, { ComponentType, createContext, createElement, ReactNode, Suspense, useContext, useRef } from 'react';
import { matchRoute, RouteMatch } from './matchRoute';
import { type Route, SearchParamsParser } from './types';
import { isPromiseLike } from './utils';

export interface Router {
  getURL<Params>(route: Route<Params>, params: Params): void;

  navigate<Params>(route: Route<Params>, params: Params, state?: unknown): void;

  back(): void;

  redirect<Params>(route: Route<Params>, params: Params): never;

  notFound(): never;

  prefetch<Params>(route: Route<Params>, params: Params): void;
}

export interface RouterProps {
  url: string | URL | Location;
  onNavigate: (url: string) => void;
  routes: Route<any>[];
  base?: string;
  onRedirect?: (url: string) => void;
  pendingComponent?: ComponentType;
  notFoundComponent?: ComponentType;
  searchParamsParser?: SearchParamsParser;
}

export function Router(props: RouterProps): ReactNode {
  const manager = (useRef<RouterManager>().current ||= new RouterManager());

  manager.onNavigate = props.onNavigate;
  manager.onRedirect = props.onRedirect;
  manager.notFoundComponent = props.notFoundComponent;

  const routeMatch = matchRoute(props.url, props.routes, props.searchParamsParser);

  const pendingComponent = manager.component || props.pendingComponent;

  manager.navigate(routeMatch);

  return (
    <RouterManagerContext.Provider value={manager}>
      <Suspense fallback={pendingComponent && createElement(pendingComponent)}>
        <Route manager={manager} />
      </Suspense>
    </RouterManagerContext.Provider>
  );
}

export function useRouter(): Router {
  const manager = useContext(RouterManagerContext);

  if (manager === null) {
    throw new Error('Expected enclosing Router');
  }
  return manager.router;
}

const RouterManagerContext = createContext<RouterManager | null>(null);

interface RouteProps {
  manager: RouterManager;
}

function Route({ manager }: RouteProps) {
  if (manager.promise !== undefined) {
    throw manager.promise;
  }
  if (manager.component !== undefined) {
    return createElement(manager.component);
  }
  return null;
}

class RouterManager {
  router: Router = {
    getURL: (route, params) => {},

    navigate: (route, params, state) => {
      this.onNavigate('');
    },

    back: () => {},

    redirect: (route, params) => {
      this.onRedirect?.('');
      throw new Redirect(this.router, route, params);
    },

    notFound: () => {
      this.component = this.notFoundComponent;
      throw new Error('Not found');
    },

    prefetch: (route, params) => {
      route.dataLoader?.(params);
    },
  };

  promise: PromiseLike<ComponentType> | undefined;
  component: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;
  onNavigate!: (url: string) => void;
  onRedirect: ((url: string) => void) | undefined;

  navigate(routeMatch: RouteMatch | null): void {
    if (routeMatch === null) {
      this.component = this.notFoundComponent;
      return;
    }

    const component = routeMatch.route.componentLoader();
    const dataPromise = routeMatch.route.dataLoader?.(routeMatch.params);

    if (isPromiseLike(component) || dataPromise !== undefined) {
      this.promise = Promise.all([component, dataPromise]).then(([component]) =>
        'default' in component ? component.default : component
      );
      return;
    }

    this.promise = undefined;
    this.component = component;
  }
}

class Redirect<Params> {
  constructor(
    public router: Router,
    public route: Route<Params>,
    public params: Params
  ) {}
}
