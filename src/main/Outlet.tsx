import React, {
  Component,
  ComponentType,
  createContext,
  ReactElement,
  ReactNode,
  Suspense,
  useContext,
  useSyncExternalStore,
} from 'react';
import { Router } from './Router.js';
import { RouteControllerProvider } from './useRoute.js';
import {
  getActiveController,
  getErrorComponent,
  getLoadingComponent,
  getNotFoundComponent,
  handleBoundaryError,
  RouteController,
} from './RouteController.js';

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
    return <RouteOutlet controller={content} />;
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
export function RouteOutlet(props: RouteOutletProps): ReactElement {
  const { controller } = props;

  if (!(controller instanceof RouteController)) {
    throw new Error('Expected a route controller');
  }

  useSyncExternalStore(controller.router.subscribe, () => controller['_state']);

  return <OutletErrorBoundary controller={controller} />;
}

/**
 * @internal
 */
RouteOutlet.displayName = 'RouteOutlet';

interface OutletErrorBoundaryProps {
  controller: RouteController;
}

interface OutletErrorBoundaryState {
  controller: RouteController;
  hasError: boolean;
  error: unknown;
}

class OutletErrorBoundary extends Component<OutletErrorBoundaryProps, OutletErrorBoundaryState> {
  static displayName = 'OutletErrorBoundary';

  constructor(props: OutletErrorBoundaryProps) {
    super(props);

    this.state = {
      controller: props.controller,
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<OutletErrorBoundaryState> | null {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    nextProps: Readonly<OutletErrorBoundaryProps>,
    prevState: OutletErrorBoundaryState
  ): Partial<OutletErrorBoundaryState> | null {
    if (nextProps.controller !== prevState.controller) {
      return {
        controller: nextProps.controller,
        hasError: false,
        error: null,
      };
    }

    if (!prevState.hasError) {
      return null;
    }

    handleBoundaryError(nextProps.controller, prevState.error);

    return { hasError: false, error: null };
  }

  render(): ReactNode {
    const { controller } = this.state;

    const activeController = getActiveController(controller);
    const loadingComponent = getLoadingComponent(controller);

    const fallback =
      // Superseded controller is available only during initial component and data loading
      (activeController !== controller && <OutletContent controller={activeController} />) ||
      ((controller.status === 'ready' || controller.status === 'loading') && loadingComponent !== undefined && (
        <RouteControllerProvider value={controller}>
          <OutletContentProvider value={null}>
            <OutletRenderer component={loadingComponent} />
          </OutletContentProvider>
        </RouteControllerProvider>
      ));

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
 * Renders a controller in accordance with its status.
 */
function OutletContent(props: OutletContentProps): ReactNode {
  const { controller } = props;
  const { route } = controller;

  controller['_renderedState'] = controller['_state'];

  let component;
  let childController = null;

  switch (controller.status) {
    case 'ready':
      component = route.component;
      childController = controller.childController;

      if (component === undefined) {
        throw new Error("Route component wasn't loaded");
      }
      break;

    case 'error':
      component = getErrorComponent(controller);
      break;

    case 'not_found':
      component = getNotFoundComponent(controller);
      break;

    case 'redirect':
      component = getLoadingComponent(controller);
      break;

    case 'loading':
      // Ensure the controller was reloaded after instantiation
      throw controller.promise || new Error('Cannot suspend route controller');

    default:
      throw new Error('Unexpected route status');
  }

  if (component === undefined) {
    throw controller['_error'];
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
