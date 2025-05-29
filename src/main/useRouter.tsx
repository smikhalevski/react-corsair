import React, { createContext, ReactElement, ReactNode, useCallback, useContext, useSyncExternalStore } from 'react';
import { Outlet, OutletProvider } from './outlet/Outlet.js';
import { Router } from './Router.js';
import { RouteProvider } from './useRoute.js';
import { RouteController } from './RouteController.js';
import { NOT_FOUND } from './notFound.js';

const RouterContext = createContext<Router | null>(null);

RouterContext.displayName = 'RouterContext';

export const InterceptedRouteContext = createContext<RouteController | null>(null);

InterceptedRouteContext.displayName = 'InterceptedRouteContext';

export const InterceptedRouteProvider = InterceptedRouteContext.Provider;

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
  const { value: router, children = <Outlet /> } = props;

  const subscribe = useCallback((listener: () => void) => router.subscribe(listener), [router]);

  useSyncExternalStore(subscribe, () => router.rootController);
  useSyncExternalStore(subscribe, () => router.interceptedController);

  return (
    <RouterContext.Provider value={router}>
      <RouteProvider value={null}>
        <InterceptedRouteProvider value={router.interceptedController}>
          <OutletProvider value={router.rootController || NOT_FOUND}>{children}</OutletProvider>
        </InterceptedRouteProvider>
      </RouteProvider>
    </RouterContext.Provider>
  );
}
