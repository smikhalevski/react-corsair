import { To } from './__types';
import { Router } from './__Router';
import { RoutePresenter, RoutePresenterState } from './RoutePresenter';
import { toLocation } from './__utils';
import { matchRoutes } from './__matchRoutes';
import { AbortablePromise } from 'parallel-universe';

export interface HydrateRouterOptions {
  stateParser?: (stateStr: string) => RoutePresenterState;
}

export function hydrateRouter(router: Router, to: To, options: HydrateRouterOptions = {}): void {
  const { stateParser = JSON.parse } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  const location = toLocation(to);

  const routeMatches = matchRoutes(location.pathname, location.searchParams, router.routes);

  const presenters: RoutePresenter[] = [];

  for (const routeMatch of routeMatches) {
    const presenter = new RoutePresenter(router, routeMatch.route, routeMatch.params);

    presenter.pendingPromise = new AbortablePromise(() => undefined);

    presenters.push(presenter);
  }

  if (ssrState instanceof Map) {
    for (const presenterIndex of ssrState.keys()) {
      presenters[presenterIndex].setState(stateParser(ssrState.get(presenterIndex)));
    }
  } else if (ssrState !== undefined) {
    throw new Error('SSR hydration already enabled');
  }

  router.rootPresenter = presenters.length !== 0 ? presenters[0] : null;

  router['_pubSub'].publish({ type: 'navigate', router, location });

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(presenterIndex, stateStr) {
      presenters[presenterIndex].setState(stateParser(stateStr));
    },
  };
}
