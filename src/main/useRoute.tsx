import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { RouteController } from './RouteController';
import { Route } from './Route';
import { Dict } from './types';

const RouteControllerContext = createContext<RouteController | null>(null);

RouteControllerContext.displayName = 'RouteControllerContext';

export const RouteControllerProvider = RouteControllerContext.Provider;

/**
 * Returns the route controller provided by the enclosing {@link Outlet}.
 *
 * @group Hooks
 */
export function useRoute(): RouteController;

/**
 * Returns the controller of the {@link route}.
 *
 * @param route The route to look up.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Hooks
 */
export function useRoute<Params extends Dict, Data, Context>(
  route: Route<any, Params, Data, Context>
): RouteController<Params, Data, Context>;

export function useRoute(route?: Route) {
  let controller = useContext(RouteControllerContext);

  if (route !== undefined) {
    // Controller lookup
    for (; controller !== null && controller.route !== route; controller = controller.parentController) {}
  }

  if (controller === null) {
    throw new Error('Cannot be used outside of a route');
  }

  const subscribe = useCallback(controller.router.subscribe.bind(controller.router), [controller]);

  const getSnapshot = () => controller.state;

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return controller;
}
