import { NotFoundSlotController, RouteSlotController } from './SlotController';
import { useSlotController } from './useSlotController';

/**
 * Returns an error that occurred during route content loading, or during rendering.
 *
 * If there's no then `undefined` is returned.
 */
export function useRouteError(): unknown {
  const controller = useSlotController();

  if (controller instanceof RouteSlotController || controller instanceof NotFoundSlotController) {
    return controller.error;
  }
}
