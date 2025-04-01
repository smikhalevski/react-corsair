import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './matchRoutes';
import { RoutePresenter } from './RoutePresenter';
import { Router } from './Router';

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

      if (replacedPresenter !== null && replacedPresenter.state.status === 'ok' && loadingAppearance === 'avoid') {
        // Keep the current page on screen
        presenter.fallbackPresenter = replacedPresenter;
      }

      replacedPresenter = null;
    } else if (!isDeepEqual(replacedPresenter.params, routeMatch.params)) {
      // Params have changed

      if (
        replacedPresenter.state.status === 'ok' &&
        (loadingAppearance === 'route_loading' || loadingAppearance === 'avoid')
      ) {
        // Keep the current page on screen
        presenter.fallbackPresenter = replacedPresenter;
      }

      presenter.params = routeMatch.params;

      replacedPresenter = replacedPresenter.childPresenter;
    } else {
      // Nothing has changed

      presenter.state = replacedPresenter.state;
      presenter.params = replacedPresenter.params;
      presenter.loadingPromise = replacedPresenter.loadingPromise;

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
