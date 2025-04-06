import React, { Component, ComponentType, createContext, ReactElement, ReactNode, Suspense, useContext } from 'react';
import { createErrorState, RouteController } from './RouteController';
import { Router } from './Router';
import { redirect } from './redirect';
import { notFound } from './notFound';
import { RouterEvent } from './types';
import { RouteControllerProvider } from './useRoute';
import { noop } from './utils';

const OutletContentContext = createContext<RouteController | Router | null>(null);

OutletContentContext.displayName = 'OutletContentContext';

export const OutletContentProvider = OutletContentContext.Provider;

/**
 * Renders a controller {@link RouterProvider provided by an enclosing router}.
 *
 * @group Routing
 */
export function Outlet(): ReactElement | null {
  const content = useContext(OutletContentContext);

  if (content instanceof RouteController) {
    return <OutletErrorBoundary controller={content} />;
  }

  if (content === null || content.notFoundComponent === undefined) {
    return null;
  }

  return (
    <RouteControllerProvider value={null}>
      <OutletContentProvider value={null}>
        <OutletRenderer component={content.notFoundComponent} />
      </OutletContentProvider>
    </RouteControllerProvider>
  );
}

/**
 * @internal
 */
Outlet.displayName = 'Outlet';

/**
 * Props of the {@link RouteOutlet} component.
 *
 * @group Routing
 */
export interface RouteOutletProps {
  /**
   * The controller rendered by an outlet.
   */
  controller: RouteController;
}

/**
 * Renders the given {@link RouteOutletProps.controller controller}.
 *
 * @example
 * const routeController = useInterceptedRoute(route);
 *
 * <RouteOutlet controller={routeController} />
 *
 * @see {@link useInterceptedRoute}
 * @group Routing
 */
export function RouteOutlet(props: RouteOutletProps): ReactElement | null {
  if (!(props.controller instanceof RouteController)) {
    throw new Error('Expected a route controller');
  }

  return <OutletErrorBoundary controller={props.controller} />;
}

/**
 * @internal
 */
RouteOutlet.displayName = 'RouteOutlet';

interface OutletErrorBoundaryProps {
  controller: RouteController;
}

interface OutletErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

class OutletErrorBoundary extends Component<OutletErrorBoundaryProps, OutletErrorBoundaryState> {
  static displayName = 'OutletErrorBoundary';

  state = { hasError: false, error: null };

  unsubscribe = noop;

  routerListener = (event: RouterEvent) => {
    if (this.props.controller === event.controller) {
      this.forceUpdate();
    }
  };

  static getDerivedStateFromError(error: unknown): Partial<OutletErrorBoundaryState> | null {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    nextProps: Readonly<OutletErrorBoundaryProps>,
    prevState: OutletErrorBoundaryState
  ): Partial<OutletErrorBoundaryState> | null {
    if (!prevState.hasError) {
      return null;
    }

    (nextProps.controller.fallbackController || nextProps.controller)['_setState'](createErrorState(prevState.error));

    return { hasError: false, error: null };
  }

  shouldComponentUpdate(nextProps: Readonly<OutletErrorBoundaryProps>): boolean {
    return this.props.controller !== nextProps.controller;
  }

  componentDidMount() {
    this.unsubscribe = this.props.controller.router.subscribe(this.routerListener);
  }

  componentDidUpdate(prevProps: Readonly<OutletErrorBoundaryProps>) {
    if (this.props.controller !== prevProps.controller) {
      this.unsubscribe();
      this.unsubscribe = this.props.controller.router.subscribe(this.routerListener);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render(): ReactNode {
    const { controller } = this.props;

    const fallback =
      (controller.state.status === 'ok' || controller.state.status === 'loading') &&
      ((controller.fallbackController !== null && <OutletContent controller={controller.fallbackController} />) ||
        (controller.loadingComponent !== undefined && (
          <RouteControllerProvider value={controller}>
            <OutletContentProvider value={null}>
              <OutletRenderer component={controller.loadingComponent} />
            </OutletContentProvider>
          </RouteControllerProvider>
        )));

    if (fallback === false) {
      return <OutletContent controller={controller} />;
    }

    return (
      <Suspense fallback={fallback}>
        <OutletContent controller={controller} />
      </Suspense>
    );
  }
}

interface OutletContentProps {
  controller: RouteController;
}

/**
 * Renders controller according to its status.
 */
function OutletContent(props: OutletContentProps): ReactNode {
  const { controller } = props;
  const { route } = controller;
  const { status } = controller.state;

  let component;
  let childController = null;

  switch (status) {
    case 'ok':
      component = route.component;
      childController = controller.childController;

      if (component === undefined) {
        throw new Error("Route component wasn't loaded");
      }
      break;

    case 'error':
      component = controller.errorComponent;

      if (component === undefined) {
        throw controller.state.error;
      }
      break;

    case 'not_found':
      component = controller.notFoundComponent || notFound();
      break;

    case 'redirect':
      component = controller.loadingComponent || redirect(controller.state.to);
      break;

    case 'loading':
      throw controller.loadingPromise || new Error('Cannot suspend route controller');

    default:
      throw new Error('Unexpected route status: ' + status);
  }

  return (
    <RouteControllerProvider value={controller}>
      <OutletContentProvider value={childController}>
        <OutletRenderer component={component} />
      </OutletContentProvider>
    </RouteControllerProvider>
  );
}

OutletContent.displayName = 'OutletContent';

interface OutletRendererProps {
  component: ComponentType;
}

/**
 * Renders a component and prevents its re-rendering.
 */
class OutletRenderer extends Component<OutletRendererProps, any> {
  static displayName = 'OutletRenderer';

  shouldComponentUpdate(nextProps: Readonly<OutletRendererProps>): boolean {
    return this.props.component !== nextProps.component;
  }

  render(): ReactNode {
    return <this.props.component />;
  }
}
