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
export function useRoute(): RouteController<object, unknown, unknown>;

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

export function useRoute(route?: Route): RouteController | null {
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

/**
 * Returns the {@link route} location params.
 *
 * @param route The route to look up.
 * @template Params Route params.
 * @group Hooks
 */
export function useRouteParams<Params extends Dict>(route: Route<any, Params>): Params {
  return useRoute(route).params;
}

/**
 * Returns the data loaded for the {@link route}.
 *
 * @param route The route to look up.
 * @template Data Data loaded by a route.
 * @group Hooks
 */
export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  const { state } = useRoute(route);

  if (state.status !== 'ok') {
    throw new Error('Cannot be used outside of a successfully loaded route');
  }

  return state.data;
}
