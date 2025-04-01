import { Dict } from './types';
import { Route } from './Route';
import { useRouteController } from './useRouteController';

/**
 * Returns params of a {@link route} or throws if used outside of route component.
 *
 * @param route The route to retrieve params for.
 * @template Params Route params.
 * @group Hooks
 */
export function useRouteParams<Params extends Dict>(route: Route<any, Params>): Params | undefined {
  return useRouteController(route)?.params as Params | undefined;
}
