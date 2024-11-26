import React, { Component, ComponentType, createContext, ReactElement, Suspense, useContext } from 'react';
import { createErrorState } from './__loadRoute';
import { NotFoundError } from './__notFound';
import { OutletState } from './__types';
import { isPromiseLike } from './__utils';
import { OutletManager } from './OutletManager';

export const OutletManagerContext = createContext<OutletManager | null>(null);

OutletManagerContext.displayName = 'OutletManagerContext';

export const ChildOutletManagerContext = createContext<OutletManager | null>(null);

ChildOutletManagerContext.displayName = 'ChildOutletManagerContext';

/**
 * Renders an {@link Router.outletManager} provided by an enclosing {@link RouterProvider}.
 *
 * @group Components
 */
export function Outlet(): ReactElement | null {
  const manager = useContext(ChildOutletManagerContext);

  if (manager === null) {
    return null;
  }

  return <OutletBoundary manager={manager} />;
}

interface OutletBoundaryProps {
  manager: OutletManager;
}

interface OutletBoundaryState {
  errorState: OutletState | null;
}

class OutletBoundary extends Component<OutletBoundaryProps, OutletBoundaryState> {
  state = { errorState: null };

  static getDerivedStateFromError(error: unknown): Partial<OutletBoundaryState> | null {
    return { errorState: createErrorState(error) };
  }

  static getDerivedStateFromProps(
    nextProps: Readonly<OutletBoundaryProps>,
    prevState: OutletBoundaryState
  ): Partial<OutletBoundaryState> | null {
    if (prevState.errorState === null) {
      return null;
    }

    nextProps.manager.activeManager.setState(prevState.errorState);

    return { errorState: null };
  }

  render(): ReactElement | null {
    const { manager } = this.props;

    if (manager === null) {
      return null;
    }

    const loadingComponent = getLoadingComponent(manager);

    if (loadingComponent === null && manager === manager.activeManager) {
      return renderOutlet(manager, true);
    }

    return <Suspense fallback={renderOutlet(manager.activeManager, true)}>{renderOutlet(manager, true)}</Suspense>;
  }
}

function renderOutlet(manager: OutletManager, isSuspendable: boolean): ReactElement | null {
  const { parentManager, router, routeMatch } = manager;

  const state = manager.loadState();

  if (isSuspendable && isPromiseLike(state)) {
    return <Await promise={state} />;
  }

  let Component;
  let childManager = null;

  if (isPromiseLike(state) || state.status === 'redirect') {
    Component = getLoadingComponent(manager);
  } else if (state.status === 'ok') {
    if (routeMatch === null || routeMatch.route.component === undefined) {
      throw new Error('Unexpected outlet state');
    }
    Component = routeMatch.route.component;
    childManager = manager.childManager;
  } else if (state.status === 'error') {
    if (routeMatch !== null && routeMatch.route.errorComponent !== undefined) {
      Component = routeMatch.route.errorComponent;
    } else if (parentManager === null && router.errorComponent !== undefined) {
      Component = router.errorComponent;
    } else {
      throw state.error;
    }
  } else if (state.status === 'not_found') {
    if (routeMatch !== null && routeMatch.route.notFoundComponent !== undefined) {
      Component = routeMatch.route.notFoundComponent;
    } else if (parentManager === null && router.notFoundComponent !== undefined) {
      Component = router.notFoundComponent;
    } else {
      throw new NotFoundError();
    }
  } else {
    throw new Error('Unknown outlet status');
  }

  if (Component === null) {
    return null;
  }

  return (
    <OutletManagerContext.Provider value={manager}>
      <ChildOutletManagerContext.Provider value={childManager}>
        <Component />
      </ChildOutletManagerContext.Provider>
    </OutletManagerContext.Provider>
  );
}

function getLoadingComponent(manager: OutletManager): ComponentType | null {
  const { parentManager, router, routeMatch } = manager;

  if (routeMatch !== null && routeMatch.route.loadingComponent !== undefined) {
    return routeMatch.route.loadingComponent;
  }

  if (parentManager === null && router.loadingComponent !== undefined) {
    return router.loadingComponent;
  }

  return null;
}

function Await(props: { promise: Promise<any> }): never {
  throw props.promise;
}
