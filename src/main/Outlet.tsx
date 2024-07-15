import React, { ReactNode, useContext } from 'react';
import { RouteSlotContent } from './RouteSlotContent';
import { Slot } from './Slot';

export const RouteSlotContentContext = React.createContext<RouteSlotContent | undefined>(undefined);

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
 * Renders a route provided by an enclosing {@link Router}.
 */
export function Outlet(props: OutletProps): ReactNode {
  const content = useContext(RouteSlotContentContext);

  if (content === undefined) {
    return props.children;
  }
  return (
    <RouteSlotContentContext.Provider value={content.childContent}>
      <Slot content={content} />
    </RouteSlotContentContext.Provider>
  );
}
