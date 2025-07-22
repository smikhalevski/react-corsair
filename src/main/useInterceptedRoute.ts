import { Dict } from './types.js';
import { Route } from './Route.js';
import { RouteController } from './RouteController.js';
import { useContext, useEffect } from 'react';
import { InterceptedRouteContext, useRouter } from './useRouter.js';
import { getLeafController } from './utils.js';

/**
 * Returns the controller of the `route` that was intercepted during navigation, or `null` if such route wasn't
 * intercepted.
 *
 * @example
 * const fooController = useInterceptedRoute(fooRoute);
 *
 * fooController !== null && <RouteOutlet controller={fooController} />
 *
 * // Navigate to the route to intercept it.
 * router.navigate(fooRoute);
 *
 * @param route The route to intercept.
 * @returns The controller of the intercepted route, or `null` if the route wasn't intercepted.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @see {@link RouteOutlet}
 * @group Routing
 */
export function useInterceptedRoute<Params extends Dict, Data, Context>(
  route: Route<any, Params, Data, Context>
): RouteController<Params, Data, Context> | null {
  const router = useRouter();
  const controller = getLeafController(useContext(InterceptedRouteContext));

  useEffect(() => router['_registerInterceptedRoute'](route), [router, route]);

  return controller !== null && controller.route === route ? controller : null;
}
