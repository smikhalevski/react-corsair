import { RouteState, Serializer, To } from './types.js';
import { Router } from './Router.js';
import { getRenderingDisposition, RouteController } from './RouteController.js';
import { AbortError, noop, toLocation } from './utils.js';
import { matchRoutes } from './matchRoutes.js';
import { AbortablePromise } from 'parallel-universe';
import { NotFoundRouteController } from './NotFoundRouteController.js';
import { NotFoundError } from './notFound.js';
import { Redirect } from './Redirect.js';

/**
 * Options provided to {@link hydrateRouter}.
 *
 * @group Server-Side Rendering
 */
export interface HydrateRouterOptions {
  /**
   * Parses the route state that was captured during SSR.
   */
  serializer?: Serializer;
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
  const { serializer = JSON } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (ssrState !== undefined && !(ssrState instanceof Map)) {
    throw new Error('The router hydration has already begun');
  }

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(index, json) {
      setControllerState(controllers[index], serializer.parse(json));
    },
  };

  const prevController = router.rootController;
  const prevLocation = router.location;
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

  if (controllers.length === 0) {
    controllers.push(new NotFoundRouteController(router, location.pathname));
  }

  const rootController = controllers[0];

  router.location = location;
  router.rootController = rootController;

  // Abort and cleanup hydration if navigation occurs
  const unsubscribe = router.subscribe(() => {
    if (router.rootController !== rootController) {
      unsubscribe();
      window.__REACT_CORSAIR_SSR_STATE__ = { set: noop };
    }
  });

  router['_pubSub'].publish({
    type: 'navigate',
    prevController,
    prevLocation,
    controller: rootController,
    location,
    isIntercepted: false,
  });

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

    // Start route component loading ahead of time
    controller.route.loadComponent();

    // Wait until controller state is available
    controller.promise = new AbortablePromise(noop);
    controller.promise.catch(noop);

    // Hydrated state is already available
    if (ssrState !== undefined && ssrState.has(i)) {
      setControllerState(controller, serializer.parse(ssrState.get(i)));
    }
  }

  return router;
}

/**
 * Silently sets the controller state.
 */
function setControllerState(controller: RouteController, state: RouteState): void {
  if (state.status === 'loading') {
    return;
  }

  const prevPromise = controller.promise;

  controller.promise = null;
  prevPromise?.abort(AbortError('The route was hydrated'));

  controller['_state'] = state;

  switch (state.status) {
    case 'not_found':
      controller['_error'] = new NotFoundError();
      break;
    case 'redirect':
      controller['_error'] = new Redirect(state.to);
      break;
    case 'error':
      controller['_error'] = state.error;
      break;
    case 'ready':
      controller['_error'] = undefined;

      if (controller.route.component === undefined) {
        controller['_state'] = { status: 'loading' };

        controller.promise = new AbortablePromise((resolve, _reject, signal) => {
          controller.route.loadComponent().then(() => {
            if (!signal.aborted) {
              controller['_state'] = state;
              resolve(state.data);
            }
          });
        });

        controller.promise.catch(noop);
      }
      break;
  }
}
