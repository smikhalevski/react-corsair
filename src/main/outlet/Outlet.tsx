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
export const Outlet: ExoticComponent = memo(_Outlet, returnTrue);

function _Outlet(): ReactNode {
  const controller = useContext(OutletContext);

  if (controller === null) {
    throw new Error('Cannot be used outside of a RouterProvider');
  }

  return <RouteOutlet controller={controller} />;
}

_Outlet.displayName = 'Outlet';
