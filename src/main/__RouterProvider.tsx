import React, { ReactElement, ReactNode, useLayoutEffect, useState } from 'react';
import { RouterContext } from './__useRouter';
import { Outlet, OutletContext, PresenterContext } from './Outlet';
import { Router } from './__Router';

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

  useLayoutEffect(() => router.subscribe(() => setRootPresenter(router.rootPresenter)), [router]);

  return (
    <RouterContext.Provider value={router}>
      <PresenterContext.Provider value={null}>
        <OutletContext.Provider value={rootPresenter || router}>{children}</OutletContext.Provider>
      </PresenterContext.Provider>
    </RouterContext.Provider>
  );
}
