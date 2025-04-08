import { Dict } from './types';
import { Route } from './Route';
import { RouteController } from './RouteController';
import { useEffect, useState } from 'react';
import { useRouter } from './useRouter';
import { AbortError } from './utils';
import { reconcileControllers } from './reconcileControllers';

/**
 * Returns the controller of the {@link route} that was intercepted during navigation, or `null` if such route wasn't
 * intercepted.
 *
 * @example
 * const routeController = useInterceptedRoute(route);
 *
 * <RouteOutlet controller={routeController} />
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
  const [controller, setController] = useState<RouteController | null>(null);

  useEffect(
    () =>
      router.intercept(routeMatches => {
        if (routeMatches[routeMatches.length - 1].route !== route) {
          setController(null);
          return false;
        }

        const prevController = controller?.fallbackController || controller;
        const nextController = reconcileControllers(router, prevController, routeMatches);

        for (let controller = nextController; controller !== null; controller = controller.childController) {
          if (controller.state.status === 'loading') {
            controller.load();
            break;
          }
        }

        prevController?.abort(AbortError('Router navigation occurred'));

        setController(nextController);
        return true;
      }),
    [router, route]
  );

  return controller;
}
