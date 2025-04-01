import { createContext, useContext, useEffect } from 'react';
import { RouteController } from './RouteController';
import { Route } from './Route';
import { useRerender } from './useRerender';

const RouteControllerContext = createContext<RouteController | null>(null);

RouteControllerContext.displayName = 'RouteControllerContext';

export const RouteControllerProvider = RouteControllerContext.Provider;

/**
 * Returns the controller rendered by the enclosing {@link Outlet}, or `null` if there's no rendered route.
 */
export function useCurrentRouteController(): RouteController | null {
  return useContext(RouteControllerContext);
}

export function useRouteController(route: Route): RouteController | null {
  const rerender = useRerender();

  let controller = useCurrentRouteController();

  for (; controller !== null; controller = controller.parentController) {
    if (controller.route === route) {
      break;
    }
  }

  useEffect(() => {
    if (controller === null) {
      return;
    }

    return controller.router.subscribe(event => {
      if (event.type !== 'navigate' && event.controller === controller) {
        rerender();
      }
    });
  }, [controller]);

  return controller;
}
