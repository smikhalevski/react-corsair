import { RouterEvent, RouteState, Serializer, To } from './types.js';
import { Router } from './Router.js';
import { getRenderingDisposition, RouteController } from './RouteController.js';
import { noop, preventUnhandledRejection, toLocation } from './utils.js';
import { matchRoutes } from './matchRoutes.js';
import { NotFoundRouteController } from './NotFoundRouteController.js';
import { NotFoundError } from './notFound.js';
import { Redirect } from './Redirect.js';
import { Route } from './Route.js';
import { AbortablePromise } from 'parallel-universe';

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
export function hydrateRouter(router: Router, to: To, options: HydrateRouterOptions = {}): void {
  const { serializer = JSON } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (ssrState !== undefined && !(ssrState instanceof Map)) {
    throw new Error('The router hydration has already begun');
  }

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(index, json) {
      setHydratedState(controllers[index], serializer.parse(json));
    },
  };

  const prevController = router.rootController;
  const prevLocation = router.location;
  const location = toLocation(to);

  const routeMatches = matchRoutes(location.pathname, location.searchParams, router.routes);

  const controllers: RouteController[] = [];

  for (const routeMatch of routeMatches) {
    const controller = new HydratedRouteController(router, routeMatch.route, routeMatch.params);
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
    return;
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
      setHydratedState(controller, serializer.parse(ssrState.get(i)));
    }
  }
}

function setHydratedState(controller: RouteController, state: RouteState): void {
  if (controller instanceof HydratedRouteController) {
    controller._setHydratedState(state);
  }
}

/**
 * A special-case controller that doesn't publish events during router hydration because React re-renders Suspense
 * boundaries on its own during document hydration.
 */
class HydratedRouteController extends RouteController {
  /**
   * - "on" Hydrated state is set to the controller, but no events are emitted.
   * - "lax" Hydrated state is set to the controller, and events are emitted. This only matters if route controller
   * state changes multiple times during SSR.
   * - "off" Hydrated state is ignored.
   */
  private _hydrationStatus: 'on' | 'lax' | 'off' = getRenderingDisposition(this) === 'server' ? 'on' : 'off';

  constructor(router: Router, route: Route, params: any) {
    super(router, route, params);

    // This promise is aborted after hydration chunk arrives
    this.promise = preventUnhandledRejection(new AbortablePromise(noop));

    // Start route component loading ahead of time
    route.loadComponent();
  }

  setError(error: any): void {
    this._hydrationStatus = 'off';
    super.setError(error);
  }

  setData(data: any): void {
    this._hydrationStatus = 'off';
    super.setData(data);
  }

  _setHydratedState(state: RouteState): void {
    if (this._hydrationStatus === 'off') {
      // Cannot proceed with hydration because user has interacted with the router
      return;
    }

    switch (state.status) {
      case 'loading':
        // Loading SSR events are ignored
        return;

      case 'not_found':
        super.setError(new NotFoundError());
        break;

      case 'redirect':
        super.setError(new Redirect(state.to));
        break;

      case 'error':
        super.setError(state.error);
        break;

      case 'ready':
        super.setData(state.data);
        break;
    }

    if (this.promise === null) {
      this._hydrationStatus = 'lax';
      return;
    }

    // lazyComponent is being loaded
    this.promise.then(() => {
      if (this._hydrationStatus === 'on') {
        this._hydrationStatus = 'lax';
      }
    });
  }

  _publish(event: RouterEvent): void {
    if (this._hydrationStatus === 'on') {
      // Events published during router hydration are discarded because
      // React re-renders Suspense boundaries on its own during document hydration
      return;
    }

    super._publish(event);
  }
}
