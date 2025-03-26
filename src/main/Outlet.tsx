import React, { createContext, ReactElement, Suspense, useContext } from 'react';
import { RoutePresenter } from './RoutePresenter';
import { OutletErrorBoundary } from './OutletErrorBoundary';

export const RoutePresenterContext = createContext<RoutePresenter | null>(null);

RoutePresenterContext.displayName = 'RoutePresenterContext';

export const ChildRoutePresenterContext = createContext<RoutePresenter | null>(null);

ChildRoutePresenterContext.displayName = 'ChildRoutePresenterContext';

export function Outlet(): ReactElement | null {
  const manager = useContext(ChildRoutePresenterContext);

  if (manager === null) {
    return null;
  }

  const children = (
    <Xxx
      manager={manager}
      canSuspend={true}
    />
  );

  if (manager.state.status === 'ok' || manager.state.status === 'loading') {
    return (
      <Suspense
        fallback={
          <Xxx
            manager={manager.fallbackPresenter}
            canSuspend={false}
          />
        }
      >
        <OutletErrorBoundary manager={manager}>{children}</OutletErrorBoundary>
      </Suspense>
    );
  }

  return children;
}

interface XxxProps {
  manager: RoutePresenter;
  canSuspend: boolean;
}

function Xxx(props: XxxProps): ReactElement | null {
  const { manager, canSuspend } = props;
  const { route } = manager.routeMatch;

  let Component;

  switch (manager.state.status) {
    case 'ok':
      Component = route.component;
      break;

    case 'error':
      Component = route.errorComponent;
      break;

    case 'loading':
      if (canSuspend) {
        throw manager.promise;
      }
      Component = route.loadingComponent;
      break;

    case 'not_found':
      Component = route.notFoundComponent;
      break;

    case 'redirect':
      Component = route.loadingComponent;
      return null;
  }

  if (Component === undefined) {
    return null;
  }

  return (
    <RoutePresenterContext.Provider value={manager}>
      <ChildRoutePresenterContext.Provider value={manager.childPresenter}>
        <Component />
      </ChildRoutePresenterContext.Provider>
    </RoutePresenterContext.Provider>
  );
}
