import React, { createContext, ReactElement, ReactNode, useCallback, useContext, useSyncExternalStore } from 'react';
import { Outlet, OutletContentProvider } from './Outlet';
import { Router } from './Router';
import { RouteControllerProvider } from './useRoute';

const RouterContext = createContext<Router | null>(null);

RouterContext.displayName = 'RouterContext';

/**
 * Returns a router provided by an enclosing {@link RouterProvider}.
 *
 * @group Routing
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

  const subscribe = useCallback(value.subscribe.bind(value), [value]);

  const getSnapshot = () => value.rootController;

  const rootController = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <RouterContext.Provider value={value}>
      <RouteControllerProvider value={null}>
        <OutletContentProvider value={rootController || value}>{children}</OutletContentProvider>
      </RouteControllerProvider>
    </RouterContext.Provider>
  );
}
