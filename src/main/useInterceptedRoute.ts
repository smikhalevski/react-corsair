import { Dict } from './types';
import { Route } from './Route';
import { RouteController } from './RouteController';
import { useContext, useEffect } from 'react';
import { InterceptedRouteControllerContext, useRouter } from './useRouter';
import { getTailController } from './utils';

/**
 * Returns the controller of the {@link route} that was intercepted during navigation, or `null` if such route wasn't
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
