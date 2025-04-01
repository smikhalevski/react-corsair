import React, { createContext, ReactElement, ReactNode, useCallback, useContext, useSyncExternalStore } from 'react';
import { Outlet, OutletProvider } from './Outlet';
import { Router } from './Router';
import { RouteControllerProvider } from './useRoute';

const RouterContext = createContext<Router | null>(null);

RouterContext.displayName = 'RouterContext';

/**
 * Returns a router provided by an enclosing {@link RouterProvider}.
 *
 * @group Hooks
 */
export function useRouter(): Router {
  const router = useContext(RouterContext);

  if (router === null) {
    throw new Error('Cannot be used outside of RouterProvider');
  }

  return router;
}

/**
 * Props of the {@link RouterProvider} component.
 *
 * @group Components
 */
export interface RouterProviderProps {
  /**
   * A router instance that populates the nested {@link Outlet}.
   */
  router: Router;

  /**
   * Children rendered by the router. An {@link Outlet} is rendered by default.
   */
  children?: ReactNode;
}

/**
 * Provides {@link Router} to underlying components.
 *
 * @group Components
 */
export function RouterProvider(props: RouterProviderProps): ReactElement {
  const { router, children = <Outlet /> } = props;

  const subscribe = useCallback(router.subscribe.bind(router), [router]);

  const getSnapshot = () => router.rootController;

  const rootController = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <RouterContext.Provider value={router}>
      <RouteControllerProvider value={null}>
        <OutletProvider value={rootController || router}>{children}</OutletProvider>
      </RouteControllerProvider>
    </RouterContext.Provider>
  );
}
