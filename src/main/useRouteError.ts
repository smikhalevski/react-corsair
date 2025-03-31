import { Route } from './Route';
import { useRoutePresenter } from './useRoutePresenter';

/**
 * Returns an error that occurred during presenter loading, or during rendering.
 *
 * If there's no then `undefined` is returned.
 *
 * @group Hooks
 */
export function useRouteError(route: Route): unknown {
  const presenter = useRoutePresenter(route);

  if (presenter === null || presenter.state.status !== 'error') {
    return;
  }
  return presenter.state.error;
}
