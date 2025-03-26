import React, { createContext, ReactElement, Suspense, useContext } from 'react';
import { RoutePresenter } from './RoutePresenter';
import { OutletErrorBoundary } from './OutletErrorBoundary';

export const RoutePresenterContext = createContext<RoutePresenter | null>(null);

RoutePresenterContext.displayName = 'RoutePresenterContext';

export const ChildRoutePresenterContext = createContext<RoutePresenter | null>(null);

ChildRoutePresenterContext.displayName = 'ChildRoutePresenterContext';

export function Outlet(): ReactElement | null {
  const presenter = useContext(ChildRoutePresenterContext);

  if (presenter === null) {
    return null;
  }

  const children = (
    <Xxx
      presenter={presenter}
      canSuspend={true}
    />
  );

  if (presenter.state.status === 'ok' || presenter.state.status === 'loading') {
    return (
      <Suspense
        fallback={
          presenter.fallbackPresenter ? (
            <Xxx
              presenter={presenter.fallbackPresenter}
              canSuspend={false}
            />
          ) : null
        }
      >
        <OutletErrorBoundary presenter={presenter}>{children}</OutletErrorBoundary>
      </Suspense>
    );
  }

  return children;
}

interface XxxProps {
  presenter: RoutePresenter;
  canSuspend: boolean;
}

function Xxx(props: XxxProps): ReactElement | null {
  const { presenter, canSuspend } = props;
  const { route } = presenter.routeMatch;

  let Component;

  switch (presenter.state.status) {
    case 'ok':
      Component = route.component;
      break;

    case 'error':
      Component = route.errorComponent;
      break;

    case 'loading':
      if (canSuspend) {
        throw presenter.promise;
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
    <RoutePresenterContext.Provider value={presenter}>
      <ChildRoutePresenterContext.Provider value={presenter.childPresenter}>
        <Component />
      </ChildRoutePresenterContext.Provider>
    </RoutePresenterContext.Provider>
  );
}
