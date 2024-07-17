import React, { ReactNode, useContext } from 'react';
import { Slot, SlotValueContext } from './Slot';

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
  const value = useContext(SlotValueContext);

  return value === undefined ? props.children : <Slot value={value} />;
}

Outlet.displayName = 'Outlet';
