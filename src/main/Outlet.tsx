import React, {
  ComponentType,
  createContext,
  ExoticComponent,
  memo,
  ReactElement,
  ReactNode,
  Suspense,
  useContext,
  useSyncExternalStore,
} from 'react';
import {
  getActiveController,
  getErrorComponent,
  getLoadingComponent,
  getNotFoundComponent,
  RouteController,
} from './RouteController.js';
import { Router } from './Router.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { RouteControllerProvider } from './useRoute.js';

const RouteContentContext = createContext<RouteController | Router | null>(null);

RouteContentContext.displayName = 'RouteContentContext';

export const RouteContentProvider = RouteContentContext.Provider;

/**
 * Renders a controller {@link RouterProvider provided by an enclosing router}.
 *
 * @group Routing
 */
export const Outlet: ExoticComponent = memo(_Outlet, propsAreEqual);

function _Outlet(): ReactNode {
  const content = useContext(RouteContentContext);

  if (content instanceof RouteController) {
    return renderController(content);
  }

  if (content === null || content.notFoundComponent === undefined) {
    return null;
  }

  return renderMemo(content.notFoundComponent);
}

_Outlet.displayName = 'Outlet';

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
 * const fooRouteController = useInterceptedRoute(fooRoute);
 *
 * fooRouteController !== null && <RouteOutlet controller={fooRouteController} />
 *
 * @see {@link useInterceptedRoute}
 * @see {@link useInlineRoute}
 * @group Routing
 */
export const RouteOutlet: ExoticComponent<RouteOutletProps> = memo(
  _RouteOutlet,
  (a, b) => a.controller === b.controller
);

function _RouteOutlet(props: RouteOutletProps): ReactElement {
  const { controller } = props;

  if (controller instanceof RouteController) {
    return renderController(controller);
  }

  throw new Error('Expected a route controller');
}

_RouteOutlet.displayName = 'RouteOutlet';

function renderController(controller: RouteController): ReactElement {
  useSyncExternalStore(controller.router.subscribe, () => controller['_state']);

  const activeController = getActiveController(controller);
  const loadingComponent = getLoadingComponent(controller);

  const children = <RouteContent controller={controller} />;

  const loadingFallback: ReactElement | false =
    // The _fallbackController is rendered as a Suspense fallback only during initial loading of this controller
    (activeController !== controller && <RouteContent controller={activeController} />) ||
    // Otherwise, the loadingComponent is rendered if a promise is thrown during rendering
    (loadingComponent !== undefined && (
      <RouteControllerProvider value={controller}>
        <RouteContentProvider value={null}>{renderMemo(loadingComponent)}</RouteContentProvider>
      </RouteControllerProvider>
    ));

  const handleError = (error: unknown, errorBoundary: ErrorBoundary): void => {
    handleBoundaryError(controller, error);
    errorBoundary.reset();
  };

  return (
    <ErrorBoundary
      fallback={null}
      onError={handleError}
    >
      {loadingFallback === false ? children : <Suspense fallback={loadingFallback}>{children}</Suspense>}
    </ErrorBoundary>
  );
}

/**
 * Called when an {@link _Outlet} that renders a `controller` has caught an `error` during rendering.
 */
export function handleBoundaryError(controller: RouteController, error: unknown): void {
  const prevStatus = controller.status;

  controller.setError(error);

  const nextStatus = controller.status;

  if (
    // Cannot render the same state after it has caused an error
    nextStatus === prevStatus ||
    // Cannot redirect from a loadingComponent because redirect renders a loadingComponent itself
    (nextStatus === 'redirect' && prevStatus === 'loading') ||
    // Rendering would cause an error because there's no component to render
    (nextStatus === 'not_found' && getNotFoundComponent(controller) === undefined) ||
    (nextStatus === 'redirect' && getLoadingComponent(controller) === undefined) ||
    (nextStatus === 'error' && getErrorComponent(controller) === undefined)
  ) {
    // Rethrow an error that cannot be rendered, so an enclosing error boundary can catch it
    throw error;
  }
}

interface RouteContentProps {
  controller: RouteController;
}

/**
 * Renders a controller in accordance with its status.
 */
function RouteContent(props: RouteContentProps): ReactNode {
  const { controller } = props;
  const { route } = controller;

  let component;
  let childController = null;

  switch (controller.status) {
    case 'ready':
      component = route.component;
      childController = controller.childController;
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
      throw new Error('Route controller has unknown status: ' + controller.status);
  }

  if (component === undefined) {
    throw new Error('No component to render: ' + controller.status);
  }

  return (
    <RouteControllerProvider value={controller}>
      <RouteContentProvider value={childController}>{renderMemo(component)}</RouteContentProvider>
    </RouteControllerProvider>
  );
}

RouteContent.displayName = 'RouteContent';

const componentCache = new WeakMap<ComponentType, ComponentType>();

function propsAreEqual(_a: object, _b: object): boolean {
  return true;
}

export function renderMemo(component: ComponentType): ReactElement {
  let Component = componentCache.get(component);

  if (Component === undefined) {
    Component = memo(component, propsAreEqual);
    componentCache.set(component, Component);
  }

  return <Component />;
}
