import React, { useContext } from 'react';
import { SlotController } from './SlotController';

export const SlotControllerContext = React.createContext<SlotController | undefined>(undefined);

SlotControllerContext.displayName = 'SlotControllerContext';

export function useSlotController(): SlotController {
  const controller = useContext(SlotControllerContext);

  if (controller === undefined) {
    throw new Error('Cannot be used outside of a route');
  }

  return controller;
}
