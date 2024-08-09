import { useContext } from 'react';
import { SlotControllerContext } from './Slot';
import { useSnapshot } from './useSnapshot';

export function useRouteError() {
  const controller = useContext(SlotControllerContext);

  if (controller === undefined) {
    throw new Error('Cannot be used outside of a route');
  }

  return useSnapshot(controller.subscribe, () => controller.error);
}
