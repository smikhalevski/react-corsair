import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './__matchRoutes';
import { isPromiseLike } from './__utils';
import { OutletManager } from './OutletManager';
import { Router } from './Router';

/**
 * Returns a manager for a given array of route matches.
 */
export function reconcileOutlets(router: Router, routeMatches: RouteMatch[]): OutletManager {
  let rootManager = null;

  for (
    let i = 0, parentManager = null, activeManager: OutletManager | null = router.outletManager.activeManager;
    i < routeMatches.length;
    ++i
  ) {
    const routeMatch = routeMatches[i];
    const manager = new OutletManager(router, routeMatch);

    if (
      activeManager !== null &&
      activeManager.state !== undefined &&
      routeMatch.route.loadingAppearance === 'auto' &&
      !isPromiseLike(activeManager.state) &&
      activeManager.state.status === 'ok'
    ) {
      // Show previous active manager during loading
      manager.activeManager = activeManager;
    }

    if (
      activeManager === null ||
      activeManager.routeMatch === null ||
      activeManager.routeMatch.route !== routeMatch.route
    ) {
      // Route has changed
      activeManager = null;
    } else if (
      activeManager.context !== manager.context ||
      !isDeepEqual(activeManager.routeMatch.params, routeMatch.params)
    ) {
      // Route is unchanged, but params have changed
      activeManager = activeManager.childManager;
    } else {
      // Route and params are unchanged, reuse existing state
      manager.activeManager = manager;
      manager.state = activeManager.state;
      activeManager = activeManager.childManager;
    }

    if (parentManager === null) {
      rootManager = manager;
    } else {
      parentManager.childManager = manager;
    }

    manager.parentManager = parentManager;
    parentManager = manager;
  }

  return rootManager === null ? new OutletManager(router, null) : rootManager;
}
