import { To } from './types.js';
import { reconcileControllers, RouteController } from './RouteController.js';
import { useRouter } from './useRouter.js';
import { useEffect, useRef, useState } from 'react';
import { getLeafController, isEqualLocation } from './utils.js';

/**
 * Returns the controller of the route that is matched inline.
 *
 * @example
 * // Matches fooRoute using the router passed to the enclosing RouteProvider
 * const fooController = useInlineRoute(fooRoute);
 *
 * fooController !== null && <RouteOutlet controller={fooController} />
 *
 * @param to The location to render.
 * @returns The controller of the matched route, or `null` if no route matched the provided location.
 * @see {@link RouteOutlet}
 * @group Routing
 */
export function useInlineRoute(to: To): RouteController | null {
  const router = useRouter();
  const toRef = useRef<To>();
  const [controller, setController] = useState<RouteController | null>(null);

  useEffect(() => {
    if (isEqualLocation(toRef.current, to)) {
      return;
    }

    toRef.current = to;

    setController(controller => {
      const nextController = reconcileControllers(router, controller, router.match(to));

      for (let controller = nextController; controller !== null; controller = controller.childController) {
        if (controller.status === 'loading') {
          controller.reload();
        }
      }

      return nextController;
    });
  }, [router, to]);

  return getLeafController(controller);
}
