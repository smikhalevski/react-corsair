import React, { ReactElement, ReactNode, useLayoutEffect, useState } from 'react';
import { RouterContext } from './useRouter';
import { ChildRoutePresenterContext, Outlet } from './Outlet';
import { Router } from './Router';

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
  const [presenter, setRoutePresenter] = useState(router.rootPresenter);

  useLayoutEffect(() => router.subscribe(() => setRoutePresenter(router.rootPresenter)), [router]);

  return (
    <RouterContext.Provider value={router}>
      <ChildRoutePresenterContext.Provider value={presenter}>{children}</ChildRoutePresenterContext.Provider>
    </RouterContext.Provider>
  );
}
