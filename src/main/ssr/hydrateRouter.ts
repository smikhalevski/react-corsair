import { To } from '../__types';
import { Router } from '../Router';
import { RoutePresenterState } from '../RoutePresenter';

export interface HydrateRouteOptions {
  stateParser?: (stateStr: string) => RoutePresenterState;
}

export function hydrateRouter(router: Router, to: To, options: HydrateRouteOptions = {}): void {
  const { stateParser = JSON.parse } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  // if (Array.isArray(ssrState)) {
  //   for (const stateStr of ssrState) {
  //     presenter.hydrate(stateParser(stateStr));
  //   }
  // } else if (ssrState !== undefined) {
  //   throw new Error('SSR hydration already enabled');
  // }
  //
  // window.__REACT_CORSAIR_SSR_STATE__ = {
  //   set(routeIndex, stateStr) {
  //     for (let i = 0; i < arguments.length; ++i) {
  //       presenter.hydrate(stateParser(arguments[i]));
  //     }
  //   },
  // };
}
