import { useContext } from 'react';
import { Route } from './Route';
import { SlotControllerContext } from './Slot';
import { RouteSlotController } from './SlotController';
import { useSnapshot } from './useSnapshot';

export function useRouteParams<Params extends object>(route: Route<any, Params>): Params {
  const controller = useContext(SlotControllerContext);

  if (controller === undefined) {
    throw new Error('Cannot be used outside of a route');
  }

  return useSnapshot(controller.subscribe, () =>
    controller instanceof RouteSlotController ? controller.params : undefined
  );
}
