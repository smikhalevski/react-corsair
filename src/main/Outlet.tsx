import React, { ComponentType, createContext, ReactElement, Suspense, useContext } from 'react';
import { RouteManager } from './RouteManager';
import { OutletErrorBoundary } from './OutletErrorBoundary';

export const RouteManagerContext = createContext<RouteManager | null>(null);

RouteManagerContext.displayName = 'RouteManagerContext';

export const ChildRouteManagerContext = createContext<RouteManager | null>(null);

ChildRouteManagerContext.displayName = 'ChildRouteManagerContext';

export function Outlet(): ReactElement | null {
  const manager = useContext(ChildRouteManagerContext);

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
            manager={manager.fallbackManager}
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
  manager: RouteManager;
  canSuspend: boolean;
}

function Xxx(props: XxxProps): ReactElement | null {
  const { manager, canSuspend } = props;
  const { route } = manager.routeMatch;

  let Component;

  switch (manager.state.status) {
    case 'ok':
      Component = route.loadComponent() as ComponentType;
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
      return null;
  }

  if (Component === undefined) {
    return null;
  }

  return (
    <RouteManagerContext.Provider value={manager}>
      <ChildRouteManagerContext.Provider value={manager.childManager}>
        <Component />
      </ChildRouteManagerContext.Provider>
    </RouteManagerContext.Provider>
  );
}
