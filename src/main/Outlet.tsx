import React, { ReactNode, useContext } from 'react';
import { ChildSlotControllerContext, Slot } from './Slot';

/**
 * Props of the {@link Outlet} component.
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
  const controller = useContext(ChildSlotControllerContext);

  return controller === undefined ? props.children : <Slot controller={controller} />;
}

/**
 * @internal
 */
Outlet.displayName = 'Outlet';
