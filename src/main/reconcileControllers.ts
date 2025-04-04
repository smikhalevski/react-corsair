import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './matchRoutes';
import { RouteController } from './RouteController';
import { Router } from './Router';

/**
 * Returns a root controller for a given array of route matches.
 */
export function reconcileControllers(
  router: Router,
  replacedController: RouteController | null,
  routeMatches: RouteMatch[]
): RouteController | null {
  let rootController = null;
  let parentController = null;

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
    } else if (
      replacedController.context !== router.context ||
      !isDeepEqual(replacedController.params, routeMatch.params)
    ) {
      // Params or router context have changed

      if (replacedController.state.status === 'ok' && loadingAppearance !== 'loading') {
        // Keep the current page on screen
        controller.fallbackController = replacedController;
      }

      replacedController = replacedController.childController;
    } else {
      if (replacedController.state.status !== 'loading') {
        // Nothing has changed and route is loaded
        controller.state = replacedController.state;
      }

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
