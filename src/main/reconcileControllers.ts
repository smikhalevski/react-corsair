import isDeepEqual from 'fast-deep-equal';
import { RouteMatch } from './__matchRoutes';
import { RouteController } from './RouteController';
import { Router } from './Router';

/**
 * Returns a root controller for a given array of route matches.
 */
export function reconcileControllers(
  router: Router,
  supersededController: RouteController | null,
  routeMatches: RouteMatch[]
): RouteController | null {
  let rootController = null;
  let parentController = null;

  for (let i = 0; i < routeMatches.length; ++i) {
    const routeMatch = routeMatches[i];
    const controller = new RouteController(router, routeMatch.route, routeMatch.params);
    const loadingAppearance = controller['_loadingAppearance'];

    if (supersededController === null || supersededController.route !== routeMatch.route) {
      // Route has changed

      if (supersededController !== null && supersededController.status === 'ready' && loadingAppearance === 'avoid') {
        // Keep the current page on screen
        controller['_supersededController'] = supersededController;
      }

      supersededController = null;
    } else if (
      supersededController['_context'] !== router.context ||
      !isDeepEqual(supersededController.params, routeMatch.params)
    ) {
      // Params or router context have changed

      if (supersededController.status === 'ready' && loadingAppearance !== 'loading') {
        // Keep the current page on screen
        controller['_supersededController'] = supersededController;
      }

      supersededController = supersededController.nestedController;
    } else {
      if (supersededController.status !== 'loading') {
        // Nothing has changed and route is loaded
        controller['_state'] = supersededController['_state'];
        controller.error = supersededController.error;
      }

      supersededController = supersededController.nestedController;
    }

    if (parentController === null) {
      rootController = controller;
    } else {
      parentController.nestedController = controller;
    }

    controller.parentController = parentController;
    parentController = controller;
  }

  return rootController;
}
