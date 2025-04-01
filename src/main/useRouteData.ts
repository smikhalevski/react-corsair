import { Route } from './Route';
import { useRouteController } from './useRouteController';

/**
 * Returns data loaded for a {@link route} or throws if used outside of route component.
 *
 * @param route The route to retrieve data for.
 * @template Data Data loaded by a route.
 * @group Hooks
 */
export function useRouteData<Data>(route: Route<any, any, Data>): Data | undefined {
  const controller = useRouteController(route);

  if (controller === null || controller.state.status !== 'ok') {
    return;
  }
  return controller.state.data as Data;
}
