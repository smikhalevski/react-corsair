import React, { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import { ChildPresenterContext, Outlet } from './Outlet';
import { Router } from './Router';

const RouterContext = createContext<Router | null>(null);

RouterContext.displayName = 'RouterContext';

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

export function useRouter(): Router {
  const router = useContext(RouterContext);

  if (router === null) {
    throw new Error('Cannot be used outside of RouterProvider');
  }

  return router;
}
