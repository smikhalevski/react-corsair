import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './matchRoutes';
import { RouteManager } from './RouteManager';
import { Router } from './Router';

/**
 * Returns a root route manager for a given array of route matches.
 */
export function reconcileRouteManagers<Context>(
  router: Router<Context>,
  routeMatches: RouteMatch[]
): RouteManager<Context> | null {
  let rootManager = null;
  let parentManager = null;
  let replacedManager = router.routeManager !== null ? router.routeManager.fallbackManager : null;

  for (let i = 0; i < routeMatches.length; ++i) {
    const routeMatch = routeMatches[i];
    const manager = new RouteManager(router, routeMatch);
    const { loadingAppearance } = routeMatch.route;

    if (replacedManager === null || replacedManager.routeMatch.route !== routeMatch.route) {
      // Route has changed

      if (replacedManager !== null && loadingAppearance === 'avoid') {
        manager.fallbackManager = replacedManager;
      }

      replacedManager = null;
    } else if (!isDeepEqual(replacedManager.routeMatch.params, routeMatch.params)) {
      // Route is unchanged, but params have changed

      if (loadingAppearance === 'route_loading' || loadingAppearance === 'avoid') {
        manager.fallbackManager = replacedManager;
      }

      replacedManager = replacedManager.childManager;
    } else {
      // Route and params are unchanged, reuse the existing state

      manager.state = replacedManager.state;
      manager.promise = replacedManager.promise;

      replacedManager = replacedManager.childManager;
    }

    if (parentManager === null) {
      rootManager = manager;
    } else {
      parentManager.childManager = manager;
    }

    manager.parentManager = parentManager;
    parentManager = manager;
  }

  return rootManager;
}
