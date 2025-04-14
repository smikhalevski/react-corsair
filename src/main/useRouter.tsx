import React, { createContext, ReactElement, ReactNode, useCallback, useContext, useSyncExternalStore } from 'react';
import { Outlet, OutletContentProvider } from './Outlet';
import { Router } from './Router';
import { RouteControllerProvider } from './useRoute';
import { RouteController } from './RouteController';

const RouterContext = createContext<Router | null>(null);

RouterContext.displayName = 'RouterContext';

export const InterceptedRouteControllerContext = createContext<RouteController | null>(null);

InterceptedRouteControllerContext.displayName = 'InterceptedRouteControllerContext';

export const InterceptedRouteControllerProvider = InterceptedRouteControllerContext.Provider;

/**
 * Returns a router provided by an enclosing {@link RouterProvider}.
 *
 * @group Routing
 */
export function useRouter(): Router {
  const router = useContext(RouterContext);

  if (router === null) {
    throw new Error('Cannot be used outside of a RouterProvider');
  }

  return router;
}

/**
 * Props of the {@link RouterProvider} component.
 *
 * @group Routing
 */
export interface RouterProviderProps {
  /**
   * A router instance that populates the nested {@link Outlet}.
   */
  value: Router;

  /**
   * Children rendered by the router. An {@link Outlet} is rendered by default.
   */
  children?: ReactNode;
}

/**
 * Provides {@link Router} to underlying components.
 *
 * @group Routing
 */
export function RouterProvider(props: RouterProviderProps): ReactElement {
  const { value, children = <Outlet /> } = props;

  useSyncExternalStore(value.subscribe, () => value.rootController);
  useSyncExternalStore(value.subscribe, () => value.interceptedController);

  return (
    <RouterContext.Provider value={value}>
      <RouteControllerProvider value={null}>
        <InterceptedRouteControllerProvider value={value.interceptedController}>
          <OutletContentProvider value={value.rootController || value}>{children}</OutletContentProvider>
        </InterceptedRouteControllerProvider>
      </RouteControllerProvider>
    </RouterContext.Provider>
  );
}
