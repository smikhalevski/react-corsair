import { useContext } from 'react';
import { Route } from './Route';
import { RouteContentContext } from './Slot';

export interface RouteState<Params, Data> {
  /**
   * Params of a route.
   */
  params: Params;

  /**
   * Data loaded by a {@link RouteOptions.loader}, or `undefined` data isn't loaded yet.
   */
  data: Data | undefined;

  /**
   * An error that was thrown during rendering.
   */
  error: unknown;

  /**
   * `true` if an {@link error} was thrown during rendering.
   */
  hasError: boolean;
}

/**
 * Returns a state of a route or throws if current route isn't the one that was provided.
 *
 * @param route A route to retrieve state of.
 */
export function useRouteState<Params extends object | void, Data>(
  route: Route<any, Params, Data>
): RouteState<Params, Data> {
  const routeContent = useContext(RouteContentContext);

  if (routeContent === undefined) {
    throw new Error('Forbidden outside of a route');
  }
  if (routeContent.route !== route) {
    throw new Error('Route is not rendered');
  }

  return {
    params: routeContent.params,
    data: routeContent.data,
    error: routeContent.error,
    hasError: routeContent.hasError,
  };
}
