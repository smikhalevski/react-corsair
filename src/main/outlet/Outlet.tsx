import React, { createContext, ExoticComponent, memo, ReactNode, useContext } from 'react';
import { RouteController } from '../RouteController.js';
import { returnTrue } from './utils.js';
import { RouteOutlet } from './RouteOutlet.js';
import { NOT_FOUND } from '../notFound.js';
import { NotFound } from './NotFound.js';

const OutletContext = createContext<RouteController | typeof NOT_FOUND | null>(null);

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
  const content = useContext(OutletContext);

  if (content === null) {
    return null;
  }

  if (content === NOT_FOUND) {
    return <NotFound />;
  }

  return <RouteOutlet controller={content} />;
}

_Outlet.displayName = 'Outlet';
