import { Route } from './Route';
import { RouteSlotController } from './SlotController';
import { useSlotController } from './useSlotController';

export function useRouteParams<Params extends object>(route: Route<any, Params>): Params {
  const controller = useSlotController();

  if (controller instanceof RouteSlotController && controller.route === route) {
    return controller.params as Params;
  }
  throw new Error("Route isn't rendered");
}
