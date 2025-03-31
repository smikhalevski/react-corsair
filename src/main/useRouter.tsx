import React, { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import { Outlet, OutletContentProvider } from './Outlet';
import { Router } from './Router';
import { RoutePresenterProvider } from './useRoutePresenter';

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
  const [rootPresenter, setRootPresenter] = useState(router.rootPresenter);

  useEffect(() => router.subscribe(() => setRootPresenter(router.rootPresenter)), [router]);

  return (
    <RouterContext.Provider value={router}>
      <RoutePresenterProvider value={null}>
        <OutletContentProvider value={rootPresenter || router}>{children}</OutletContentProvider>
      </RoutePresenterProvider>
    </RouterContext.Provider>
  );
}
