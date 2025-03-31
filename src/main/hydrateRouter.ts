import { To } from './types';
import { Router } from './Router';
import { RoutePresenter, RoutePresenterState } from './RoutePresenter';
import { toLocation } from './utils';
import { matchRoutes } from './matchRoutes';
import { AbortablePromise } from 'parallel-universe';

/**
 * Options provided to {@link hydrateRouter}.
 */
export interface HydrateRouterOptions {
  /**
   * Parses the route presenter state that was captured during SSR.
   *
   * @param stateStr The state to parse.
   */
  stateParser?: (stateStr: string) => RoutePresenterState;
}

/**
 * Enables the SSR hydration for the given router that was navigated to a {@link to location} during SSR.
 *
 * **Note:** SSR hydration can be enabled only for one router.
 *
 * @param router The router for which SSR hydration must be enabled.
 * @param to The location to which router was navigated during SSR.
 * @param options Hydration options.
 * @returns The provided router.
 * @template T The hydrated router.
 */
export function hydrateRouter<T extends Router>(router: T, to: To, options: HydrateRouterOptions = {}): T {
  const { stateParser = JSON.parse } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (ssrState !== undefined && !(ssrState instanceof Map)) {
    throw new Error('Router hydration already enabled');
  }

  const location = toLocation(to);

  const routeMatches = matchRoutes(location.pathname, location.searchParams, router.routes);

  // Presenters that capture the SSR state
  const presenters: RoutePresenter[] = [];

  for (const routeMatch of routeMatches) {
    const presenter = new RoutePresenter(router, routeMatch.route, routeMatch.params);
    const presenterIndex = presenters.push(presenter) - 1;

    if (presenterIndex > 0) {
      presenter.parentPresenter = presenters[presenterIndex - 1];
      presenters[presenterIndex - 1].childPresenter = presenter;
    }
  }

  if (ssrState instanceof Map) {
    for (const presenterIndex of ssrState.keys()) {
      presenters[presenterIndex].setState(stateParser(ssrState.get(presenterIndex)));
    }
  }

  for (const presenter of presenters) {
    // TODO Check renderingDisposition
    if (presenter.state.status === 'loading') {
      presenter.pendingPromise = new AbortablePromise(() => {});
    }
  }

  router.rootPresenter = presenters.length !== 0 ? presenters[0] : null;

  router['_pubSub'].publish({ type: 'navigate', router, location });

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(presenterIndex, stateStr) {
      presenters[presenterIndex].setState(stateParser(stateStr));
    },
  };

  return router;
}
