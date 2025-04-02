import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './matchRoutes';
import { RouteController } from './RouteController';
import { Router } from './Router';

/**
 * Returns a root controller for a given array of route matches.
 */
export function reconcileControllers(router: Router, routeMatches: RouteMatch[]): RouteController | null {
  let rootController = null;
  let parentController = null;
  let replacedController =
    router.rootController !== null ? router.rootController.fallbackController || router.rootController : null;

  for (let i = 0; i < routeMatches.length; ++i) {
    const routeMatch = routeMatches[i];
    const controller = new RouteController(router, routeMatch.route, routeMatch.params);
    const { loadingAppearance } = routeMatch.route;

    if (replacedController === null || replacedController.route !== routeMatch.route) {
      // Route has changed

      if (replacedController !== null && replacedController.state.status === 'ok' && loadingAppearance === 'avoid') {
        // Keep the current page on screen
        controller.fallbackController = replacedController;
      }

      replacedController = null;
    } else if (!isDeepEqual(replacedController.params, routeMatch.params)) {
      // Params have changed

      if (
        replacedController.state.status === 'ok' &&
        (loadingAppearance === 'route_loading' || loadingAppearance === 'avoid')
      ) {
        // Keep the current page on screen
        controller.fallbackController = replacedController;
      }

      replacedController = replacedController.childController;
    } else {
      // Nothing has changed

      controller.state = replacedController.state;
      controller.loadingPromise = replacedController.loadingPromise;

      replacedController = replacedController.childController;
    }

    if (parentController === null) {
      rootController = controller;
    } else {
      parentController.childController = controller;
    }

    controller.parentController = parentController;
    parentController = controller;
  }

  return rootController;
}
