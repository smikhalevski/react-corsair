import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import { RouterContext } from './__useRouter';
import { ChildPresenterContext, Outlet } from './Outlet';
import { Router } from './Router';

export interface RouterProviderProps {
  router: Router;
  children?: ReactNode;
}

export function RouterProvider(props: RouterProviderProps): ReactElement {
  const { router, children = <Outlet /> } = props;
  const [presenter, setPresenter] = useState(router.presenters[0]);

  useEffect(() => router.subscribe(() => setPresenter(router.presenters[0])), [router]);

  return (
    <RouterContext.Provider value={router}>
      <ChildPresenterContext.Provider value={presenter}>{children}</ChildPresenterContext.Provider>
    </RouterContext.Provider>
  );
}
