import { To } from './types';
import { Router } from './Router';
import { RoutePresenter, RoutePresenterState } from './RoutePresenter';
import { noop, toLocation } from './utils';
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
 * Hydrates the {@link router} with the state provided by SSR.
 *
 * To render SSR state, call {@link hydrateRouter} instead of the initial {@link Router.navigate} call.
 *
 * **Note:** SSR hydration can be enabled only for one router.
 *
 * @param router The hydrated router.
 * @param to The location to which the router was navigated during SSR.
 * @param options Hydration options.
 * @returns The provided router.
 * @template T The hydrated router.
 */
export function hydrateRouter<T extends Router>(router: T, to: To, options: HydrateRouterOptions = {}): T {
  const { stateParser = JSON.parse } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (ssrState !== undefined && !(ssrState instanceof Map)) {
    throw new Error('Router hydration has already begun');
  }

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(index, stateStr) {
      presenters[index].setState(stateParser(stateStr));
    },
  };

  const location = toLocation(to);

  const routeMatches = matchRoutes(location.pathname, location.searchParams, router.routes);

  const presenters: RoutePresenter[] = [];

  for (const routeMatch of routeMatches) {
    const presenter = new RoutePresenter(router, routeMatch.route, routeMatch.params);
    const i = presenters.push(presenter) - 1;

    if (i !== 0) {
      presenter.parentPresenter = presenters[i - 1];
      presenters[i - 1].childPresenter = presenter;
    }
  }

  router.rootPresenter = presenters.length !== 0 ? presenters[0] : null;

  router['_pubSub'].publish({ type: 'navigate', router, location });

  for (let i = 0; i < presenters.length; ++i) {
    const presenter = presenters[i];

    // Load on the client side
    if (presenter.route.renderingDisposition === 'client') {
      presenter.reload();
      continue;
    }

    // Hydrate
    if (ssrState !== undefined && ssrState.has(i)) {
      presenter.setState(stateParser(ssrState.get(i)));
    }

    // Deferred hydration
    if (presenter.state.status === 'loading') {
      presenter.promise = new AbortablePromise(noop);
      presenter.promise.catch(noop);
    }
  }

  return router;
}
