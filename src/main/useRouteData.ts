import { Route } from './Route';
import { useRoutePresenter } from './useRoutePresenter';

/**
 * Returns data loaded for a {@link route} or throws if used outside of route component.
 *
 * @param route The route to retrieve data for.
 * @template Data Data loaded by a route.
 * @group Hooks
 */
export function useRouteData<Data>(route: Route<any, any, Data>): Data | undefined {
  const presenter = useRoutePresenter(route);

  if (presenter === null || presenter.state.status !== 'ok') {
    return;
  }
  return presenter.state.data as Data;
}
