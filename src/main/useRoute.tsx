import { createContext, useContext } from 'react';
import { RouteController } from './RouteController.js';
import { Route } from './Route.js';
import { Dict } from './types.js';
import { useRouteSubscription } from './useRouteSubscription.js';

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
 * Returns the controller of the `route` if it was matched by the router, or throws an error if there's no such
 * controller.
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
  if (route !== undefined) {
    while (controller !== null && controller.route !== route) {
      controller = controller.parentController;
    }
  }

  if (controller === null) {
    throw new Error('Cannot be used outside of a route');
  }

  useRouteSubscription(controller);

  return controller;
}
