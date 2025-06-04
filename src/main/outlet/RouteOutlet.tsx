import { getActiveController, getLoadingComponent, RouteController } from '../RouteController.js';
import React, { ExoticComponent, memo, ReactElement, Suspense } from 'react';
import { RouteContent } from './RouteContent.js';
import { RouteProvider } from '../useRoute.js';
import { createMemoElement } from './utils.js';
import { ErrorBoundary } from '../ErrorBoundary.js';
import { OutletProvider } from './Outlet.js';
import { useRouteSubscription } from '../useRouteSubscription.js';
import { isEqualError } from '../utils.js';

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

  useRouteSubscription(controller);

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
    if (isEqualError(controller['_error'], error)) {
      // The error was thrown by a data loader, and re-thrown during rendering because there's no corresponding component
      throw error;
    }

    const prevStatus = controller.status;

    controller.setError(error);

    if (controller.status === prevStatus) {
      // Cannot render the same status after it has caused an error
      throw error;
    }

    // Reset the boundary so the controller is rendered again with the updated state
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
