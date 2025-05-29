import {
  getActiveController,
  getErrorComponent,
  getLoadingComponent,
  getNotFoundComponent,
  RouteController,
} from '../RouteController.js';
import React, { ExoticComponent, memo, ReactElement, Suspense, useCallback, useSyncExternalStore } from 'react';
import { RouteContent } from './RouteContent.js';
import { RouteProvider } from '../useRoute.js';
import { createMemoElement } from './utils.js';
import { ErrorBoundary } from '../ErrorBoundary.js';
import { OutletProvider } from './Outlet.js';

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
 * Renders the given {@link RouteOutletProps.controller route controller}.
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

  if (!(controller instanceof RouteController)) {
    throw new Error('Expected a route controller');
  }

  const subscribe = useCallback((listener: () => void) => controller.router.subscribe(listener), [controller]);

  useSyncExternalStore(subscribe, () => controller['_state']);

  const activeController = getActiveController(controller);
  const loadingComponent = getLoadingComponent(controller);

  const children = <RouteContent controller={controller} />;

  const suspenseFallback: ReactElement | false =
    // The _fallbackController is rendered as a Suspense fallback only during initial loading of the controller
    (activeController !== controller && <RouteContent controller={activeController} />) ||
    // Otherwise, the loadingComponent is rendered
    (loadingComponent !== undefined && (
      <RouteProvider value={controller}>
        <OutletProvider value={null}>{createMemoElement(loadingComponent)}</OutletProvider>
      </RouteProvider>
    ));

  const handleError = (error: unknown, errorBoundary: ErrorBoundary): void => {
    handleRouteError(controller, error);
    errorBoundary.reset();
  };

  return (
    <ErrorBoundary
      fallback={null}
      onError={handleError}
    >
      {suspenseFallback === false ? children : <Suspense fallback={suspenseFallback}>{children}</Suspense>}
    </ErrorBoundary>
  );
}

_RouteOutlet.displayName = 'RouteOutlet';

/**
 * Called when an {@link Outlet} that renders a `controller` has caught an `error` during rendering.
 */
export function handleRouteError(controller: RouteController, error: unknown): void {
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
