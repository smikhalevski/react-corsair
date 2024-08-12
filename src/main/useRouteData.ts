import { useContext } from 'react';
import { Route } from './Route';
import { SlotControllerContext } from './Slot';
import { RouteSlotController } from './SlotController';
import { useSnapshot } from './useSnapshot';

export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  const controller = useContext(SlotControllerContext);

  if (controller === undefined) {
    throw new Error('Cannot be used outside of a route');
  }

  return useSnapshot(controller.subscribe, () =>
    controller instanceof RouteSlotController ? controller.data : undefined
  ) as any;
}
