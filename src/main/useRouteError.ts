import { NotFoundSlotController, RouteSlotController } from './SlotController';
import { useSlotController } from './useSlotController';

export function useRouteError(): unknown {
  const controller = useSlotController();

  if (controller instanceof RouteSlotController || controller instanceof NotFoundSlotController) {
    return controller.error;
  }
}
