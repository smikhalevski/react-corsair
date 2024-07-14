import React, { ReactNode, useContext } from 'react';
import { ChildSlotContentContext, Slot } from './Slot';

/**
 * Props of an {@link Outlet}.
 */
export interface OutletProps {
  /**
   * A content that is rendered if there's nothing render.
   */
  children?: ReactNode;
}

/**
 * Renders route provided be an enclosing {@link Router}.
 */
export function Outlet(props: OutletProps): ReactNode {
  const content = useContext(ChildSlotContentContext);

  return (
    <Slot
      content={content}
      children={props.children}
    />
  );
}
