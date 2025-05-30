import { useCallback, useSyncExternalStore } from 'react';
import { RouteController } from './RouteController.js';

/**
 * Re-renders the host component when the controller state changes.
 */
export function useRouteSubscription(controller: RouteController): void {
  const getState = () => controller['_state'];

  useSyncExternalStore(
    useCallback(listener => controller.router.subscribe(listener), [controller]),
    getState,
    getState
  );
}
