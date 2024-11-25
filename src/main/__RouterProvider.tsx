import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import { RouterContext } from './__useRouter';
import { Outlet, OutletModelContext } from './Outlet';
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
  const [outletModel, setOutletModel] = useState(router.outletModel);

  useEffect(() => router.subscribe(() => setOutletModel(router.outletModel)), [router]);

  return (
    <RouterContext.Provider value={router}>
      <OutletModelContext.Provider value={outletModel}>{children}</OutletModelContext.Provider>
    </RouterContext.Provider>
  );
}
