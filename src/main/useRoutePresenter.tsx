import { createContext, useContext, useEffect } from 'react';
import { RoutePresenter } from './RoutePresenter';
import { Route } from './Route';
import { useRerender } from './useRerender';

const RoutePresenterContext = createContext<RoutePresenter | null>(null);

RoutePresenterContext.displayName = 'RoutePresenterContext';

export const RoutePresenterProvider = RoutePresenterContext.Provider;

/**
 * Returns the route presenter rendered by the enclosing {@link Outlet}, or `null` if there's no rendered route.
 */
export function useCurrentRoutePresenter(): RoutePresenter | null {
  return useContext(RoutePresenterContext);
}

export function useRoutePresenter(route: Route): RoutePresenter | null {
  const rerender = useRerender();

  let presenter = useCurrentRoutePresenter();

  for (; presenter !== null; presenter = presenter.parentPresenter) {
    if (presenter.route === route) {
      break;
    }
  }

  useEffect(() => {
    if (presenter === null) {
      return;
    }

    return presenter.router.subscribe(event => {
      if (event.type !== 'navigate' && event.presenter === presenter) {
        rerender();
      }
    });
  }, [presenter]);

  return presenter;
}
