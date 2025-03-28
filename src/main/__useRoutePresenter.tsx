import { createContext, useContext } from 'react';
import { RoutePresenter } from './RoutePresenter';

const RoutePresenterContext = createContext<RoutePresenter | null>(null);

RoutePresenterContext.displayName = 'RoutePresenterContext';

export const RoutePresenterProvider = RoutePresenterContext.Provider;

/**
 * Returns the route presenter rendered by the enclosing {@link Outlet}, or `null` if there's no rendered route.
 */
export function useRoutePresenter(): RoutePresenter | null {
  return useContext(RoutePresenterContext);
}
