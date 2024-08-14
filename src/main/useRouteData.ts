import { Route } from './Route';
import { RouteSlotController } from './SlotController';
import { useSlotController } from './useSlotController';

export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  const controller = useSlotController();

  if (!(controller instanceof RouteSlotController && controller.route === route)) {
    throw new Error("Route isn't rendered");
  }
  if (controller.status !== 'ok') {
    throw new Error("Route isn't loaded");
  }
  return controller.data as Data;
}
