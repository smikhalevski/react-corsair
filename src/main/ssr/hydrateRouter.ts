import { OutletState, To } from '../__types';
import { Router } from '../Router';

export interface HydrateRouteOptions {
  stateParser?: (stateStr: string) => OutletState;
}

export function hydrateRouter(router: Router, to: To, options: HydrateRouteOptions = {}): void {
  const { stateParser = JSON.parse } = options;

  const ssrState =
    typeof window.__REACT_CORSAIR_SSR_STATE__ !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  // if (Array.isArray(ssrState)) {
  //   for (const stateStr of ssrState) {
  //     manager.hydrate(stateParser(stateStr));
  //   }
  // } else if (ssrState !== undefined) {
  //   throw new Error('SSR hydration already enabled');
  // }
  //
  // window.__REACT_CORSAIR_SSR_STATE__ = {
  //   set(routeIndex, stateStr) {
  //     for (let i = 0; i < arguments.length; ++i) {
  //       manager.hydrate(stateParser(arguments[i]));
  //     }
  //   },
  // };
}
