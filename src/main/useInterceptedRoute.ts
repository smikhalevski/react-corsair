import { Dict } from './types.js';
import { Route } from './Route.js';
import { RouteController } from './RouteController.js';
import { useContext, useEffect } from 'react';
import { InterceptedRouteControllerContext, useRouter } from './useRouter.js';
import { getTailController } from './utils.js';

/**
 * Returns the controller of the `route` that was intercepted during navigation, or `null` if such route wasn't
 * intercepted.
 *
 * @example
 * const fooController = useInterceptedRoute(fooRoute);
 *
 * fooController !== null && <RouteOutlet controller={fooController} />
 *
 * @param route The route to intercept.
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
  const controller = getTailController(useContext(InterceptedRouteControllerContext));

  useEffect(() => router['_registerInterceptedRoute'](route), [router, route]);

  return controller !== null && controller.route === route ? controller : null;
}
