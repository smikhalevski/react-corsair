import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './__matchRoutes';
import { RoutePresenter } from './RoutePresenter';
import { Router } from './__Router';

/**
 * Returns a root presenter for a given array of route matches.
 */
export function reconcilePresenters(router: Router, routeMatches: RouteMatch[]): RoutePresenter | null {
  let rootPresenter = null;
  let parentPresenter = null;
  let replacedPresenter =
    router.rootPresenter !== null ? router.rootPresenter.fallbackPresenter || router.rootPresenter : null;

  for (let i = 0; i < routeMatches.length; ++i) {
    const routeMatch = routeMatches[i];
    const presenter = new RoutePresenter(router, routeMatch.route, routeMatch.params);
    const { loadingAppearance } = routeMatch.route;

    if (replacedPresenter === null || replacedPresenter.route !== routeMatch.route) {
      // Route has changed

      if (replacedPresenter !== null && loadingAppearance === 'avoid') {
        presenter.fallbackPresenter = replacedPresenter;
      }

      replacedPresenter = null;
    } else if (!isDeepEqual(replacedPresenter.params, routeMatch.params)) {
      // Route is unchanged, but params have changed

      if (loadingAppearance === 'route_loading' || loadingAppearance === 'avoid') {
        presenter.fallbackPresenter = replacedPresenter;
      }

      replacedPresenter = replacedPresenter.childPresenter;
    } else {
      // Route and params are unchanged, reuse the existing state

      presenter.state = replacedPresenter.state;
      presenter.pendingPromise = replacedPresenter.pendingPromise;

      replacedPresenter = replacedPresenter.childPresenter;
    }

    if (parentPresenter === null) {
      rootPresenter = presenter;
    } else {
      parentPresenter.childPresenter = presenter;
    }

    presenter.parentPresenter = parentPresenter;
    parentPresenter = presenter;
  }

  return rootPresenter;
}
