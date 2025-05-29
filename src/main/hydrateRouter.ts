import { RouteState, To } from './types.js';
import { Router } from './Router.js';
import { getRenderingDisposition, RouteController } from './RouteController.js';
import { AbortError, noop, toLocation } from './utils.js';
import { matchRoutes } from './matchRoutes.js';
import { AbortablePromise } from 'parallel-universe';

/**
 * Options provided to {@link hydrateRouter}.
 *
 * @group Server-Side Rendering
 */
export interface HydrateRouterOptions {
  /**
   * Parses the route state that was captured during SSR.
   *
   * @param stateStr The state to parse.
   */
  stateParser?: (stateStr: string) => RouteState;
}

/**
 * Hydrates the `router` with the state provided by SSR.
 *
 * To render SSR state, call {@link hydrateRouter} instead of the initial {@link Router.navigate navigate} call.
 *
 * **Note:** SSR hydration can be enabled only for one router.
 *
 * @param router The hydrated router.
 * @param to The location to which the router was navigated during SSR.
 * @param options Hydration options.
 * @returns The provided router.
 * @template T The hydrated router.
 * @group Server-Side Rendering
 */
export function hydrateRouter<T extends Router>(router: T, to: To, options: HydrateRouterOptions = {}): T {
  const { stateParser = JSON.parse } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (ssrState !== undefined && !(ssrState instanceof Map)) {
    throw new Error('The router hydration has already begun');
  }

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(index, stateStr) {
      setControllerState(controllers[index], stateParser(stateStr));
    },
  };

  const location = toLocation(to);

  const routeMatches = matchRoutes(location.pathname, location.searchParams, router.routes);

  const controllers: RouteController[] = [];

  for (const routeMatch of routeMatches) {
    const controller = new RouteController(router, routeMatch.route, routeMatch.params);
    const i = controllers.push(controller) - 1;

    if (i !== 0) {
      controller.parentController = controllers[i - 1];
      controllers[i - 1].childController = controller;
    }
  }

  const rootController = controllers.length !== 0 ? controllers[0] : null;

  router.rootController = rootController;

  // Abort and cleanup hydration if navigation occurs
  const unsubscribe = router.subscribe(() => {
    if (router.rootController !== rootController) {
      unsubscribe();
      window.__REACT_CORSAIR_SSR_STATE__ = { set: noop };
    }
  });

  router['_pubSub'].publish({ type: 'navigate', controller: rootController, router, location, isIntercepted: false });

  if (router.rootController !== rootController) {
    // Hydrated navigation was superseded
    return router;
  }

  for (let i = 0; i < controllers.length; ++i) {
    const controller = controllers[i];

    // Client-only route, no hydration
    if (getRenderingDisposition(controller) !== 'server') {
      controllers[i].reload();
      continue;
    }

    // Hydrated state is already available
    if (ssrState !== undefined && ssrState.has(i)) {
      setControllerState(controller, stateParser(ssrState.get(i)));
    }

    // Server-rendering is in progress, defer hydration
    if (controller.status === 'loading') {
      // Start loading the route component ahead of time
      void controller.route.loadComponent();

      controller.promise = new AbortablePromise(noop);
      controller.promise.catch(noop);
    }
  }

  return router;
}

function setControllerState(controller: RouteController, state: RouteState): void {
  if (state.status === 'loading') {
    return;
  }

  const prevPromise = controller.promise;

  controller.promise = null;
  controller['_state'] = state;

  prevPromise?.abort(AbortError('The route was hydrated'));
}
