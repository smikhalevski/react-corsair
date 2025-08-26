import React, { createContext, ExoticComponent, memo, ReactNode, useContext } from 'react';
import { RouteController } from '../RouteController.js';
import { returnTrue } from './utils.js';
import { RouteOutlet } from './RouteOutlet.js';

const OutletContext = createContext<RouteController | null>(null);

OutletContext.displayName = 'OutletContext';

/**
 * @internal
 */
export const OutletProvider = OutletContext.Provider;

/**
 * Props of the {@link Outlet} component.
 *
 * @group Routing
 */
export interface OutletProps {
  /**
   * Children that are rendered if there's no route to render in an outlet.
   */
  fallback?: ReactNode;
}

/**
 * Renders a route {@link RouterProvider provided by an enclosing router}.
 *
 * ```tsx
 * <RouterProvider value={router}>
 *   <Outlet />
 * </RouterProvider>
 * ```
 *
 * @group Routing
 */
export const Outlet: ExoticComponent<OutletProps> = memo(_Outlet, returnTrue);

function _Outlet(props: OutletProps): ReactNode {
  const controller = useContext(OutletContext);

  return controller === null ? props.fallback : <RouteOutlet controller={controller} />;
}

_Outlet.displayName = 'Outlet';
