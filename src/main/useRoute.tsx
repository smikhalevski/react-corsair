import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { RouteController } from './RouteController.js';
import { Route } from './Route.js';
import { Dict } from './types.js';

const RouteContext = createContext<RouteController | null>(null);

RouteContext.displayName = 'RouteContext';

export const RouteProvider = RouteContext.Provider;

/**
 * Returns the route controller provided by the enclosing {@link Outlet}.
 *
 * @group Routing
 */
export function useRoute(): RouteController;

/**
 * Returns the controller of the `route` if it was matched by the router.
 *
 * @param route The route to look up.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export function useRoute<Params extends Dict, Data, Context>(
  route: Route<any, Params, Data, Context>
): RouteController<Params, Data, Context>;

export function useRoute(route?: Route) {
  let controller = useContext(RouteContext);

  // Controller lookup
  while (route !== undefined && controller !== null && controller.route !== route) {
    controller = controller.parentController;
  }

  if (controller === null) {
    throw new Error('Cannot be used outside of a route');
  }

  const subscribe = useCallback((listener: () => void) => controller.router.subscribe(listener), [controller]);

  useSyncExternalStore(subscribe, () => controller['_state']);

  return controller;
}
