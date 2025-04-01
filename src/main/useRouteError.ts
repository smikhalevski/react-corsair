import { Route } from './Route';
import { useRouteController } from './useRouteController';

/**
 * Returns an error that occurred during controller loading, or during rendering.
 *
 * If there's no then `undefined` is returned.
 *
 * @group Hooks
 */
export function useRouteError(route: Route): unknown {
  const controller = useRouteController(route);

  if (controller === null || controller.state.status !== 'error') {
    return;
  }
  return controller.state.error;
}
