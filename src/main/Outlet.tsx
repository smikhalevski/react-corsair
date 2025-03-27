import React, { ComponentType, createContext, memo, ReactElement, Suspense, useContext } from 'react';
import { RoutePresenter } from './RoutePresenter';
import { OutletErrorBoundary } from './__OutletErrorBoundary';
import { Router } from './__Router';

export const PresenterContext = createContext<RoutePresenter | null>(null);

PresenterContext.displayName = 'PresenterContext';

export const OutletContext = createContext<RoutePresenter | Router | null>(null);

OutletContext.displayName = 'OutletContext';

/**
 * Renders presenter {@link RouterProvider provided by an enclosing router}.
 *
 * @group Components
 */
export const Outlet = memo(
  () => {
    const presenter = useContext(OutletContext);

    if (presenter === null) {
      // Nothing to render
      return null;
    }

    if (presenter instanceof Router) {
      // No route was matched

      const Component = presenter.notFoundComponent;

      if (Component === undefined) {
        return null;
      }

      return (
        <OutletContext.Provider value={null}>
          <RenderBoundary Component={Component} />
        </OutletContext.Provider>
      );
    }

    const { status } = presenter.state;

    if (status === 'error' || status === 'not_found' || status === 'redirect') {
      return (
        <RouteOutlet
          presenter={presenter}
          canSuspend={false}
        />
      );
    }

    return (
      <Suspense
        fallback={
          <RouteOutlet
            presenter={presenter.fallbackPresenter || presenter}
            canSuspend={false}
          />
        }
      >
        <RouteOutlet
          presenter={presenter}
          canSuspend={true}
        />
      </Suspense>
    );
  },
  (_prevProps, _nextProps) => true
);

interface RouteOutletProps {
  presenter: RoutePresenter;
  canSuspend: boolean;
}

function RouteOutlet(props: RouteOutletProps): ReactElement | null {
  const { presenter, canSuspend } = props;
  const { route } = presenter;

  const fallbacks = presenter.parentPresenter === null ? presenter.router : route;

  let Component;

  switch (presenter.state.status) {
    case 'ok':
      Component = route.component;
      break;

    case 'error':
      Component = route.errorComponent || fallbacks.errorComponent;
      break;

    case 'loading':
      if (canSuspend && presenter.pendingPromise !== null) {
        throw presenter.pendingPromise;
      }
      Component = route.loadingComponent || fallbacks.loadingComponent;
      break;

    case 'not_found':
      Component = route.notFoundComponent || fallbacks.notFoundComponent;
      break;

    case 'redirect':
      Component = route.loadingComponent || fallbacks.loadingComponent;
      break;
  }

  if (Component === undefined) {
    return null;
  }

  return (
    <PresenterContext.Provider value={presenter}>
      <OutletContext.Provider value={presenter.childPresenter}>
        <OutletErrorBoundary presenter={presenter}>
          <RenderBoundary Component={Component} />
        </OutletErrorBoundary>
      </OutletContext.Provider>
    </PresenterContext.Provider>
  );
}

RouteOutlet.displayName = 'RouteOutlet';

const RenderBoundary = memo<{ Component: ComponentType }>(
  props => <props.Component />,
  (prevProps, nextProps) => prevProps.Component === nextProps.Component
);
