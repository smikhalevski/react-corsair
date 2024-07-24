import React, { ReactNode, useContext } from 'react';
import { Slot, SlotControllerContext } from './Slot';

/**
 * Props of an {@link Outlet}.
 */
export interface OutletProps {
  /**
   * A content that is rendered if there's no route to render.
   */
  children?: ReactNode;
}

/**
 * Renders a route provided by an enclosing {@link Router}.
 */
export function Outlet(props: OutletProps): ReactNode {
  const controller = useContext(SlotControllerContext);

  return controller === undefined ? props.children : <Slot controller={controller} />;
}

/**
 * @internal
 */
Outlet.displayName = 'Outlet';
