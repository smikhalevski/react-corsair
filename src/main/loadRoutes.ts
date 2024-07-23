import { ComponentType } from 'react';
import { RouteMatch } from './matchRoutes';
import { Route } from './Route';
import { isPromiseLike } from './utils';

/**
 * A payload produced during a route SSR.
 */
export interface SSRRoutePayload {
  /**
   * Data available in a route component.
   */
  data?: unknown;

  /**
   * An error that occurred when content was resolved.
   */
  error?: unknown;

  /**
   * `true` if {@link error} contains an actual error.
   */
  hasError?: boolean;
}

/**
 * A payload produced during a route loading.
 */
export interface RoutePayload {
  /**
   * A component rendered by a route, or `undefined` if an {@link error} occurred.
   */
  component: ComponentType | undefined;

  /**
   * Data available in a route component.
   */
  data: unknown;

  /**
   * An error that occurred during a state resolution.
   */
  error: unknown;

  /**
   * `true` if {@link error} contains an actual error.
   */
  hasError: boolean;
}

/**
 * Loads components and data for matched routes.
 */
export function loadRoutes(routeMatches: RouteMatch[], context: unknown): Array<Promise<RoutePayload> | RoutePayload> {
  return routeMatches.map(routeMatch => loadRoute(routeMatch.route, routeMatch.params, context));
}

/**
 * Loads a component and data for a route.
 */
export function loadRoute(route: Route, params: unknown, context: unknown): Promise<RoutePayload> | RoutePayload {
  let component;
  let data;

  try {
    component = route.getComponent();

    data = route.loader?.(params, context);
  } catch (error) {
    return createErrorPayload(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(pair => createOkPayload(pair[0], pair[1]), createErrorPayload);
  }

  return createOkPayload(component, data);
}

/**
 * Returns SSR payloads on the client when called _the first time_, and clears SSR payloads on every consequent call.
 */
export function takeOrClearSSRPayloads(
  routeCount: number,
  payloadParser: (payloadStr: string) => SSRRoutePayload
): Array<Promise<SSRRoutePayload> | SSRRoutePayload> | null {
  const ssrPayloads = window.__REACT_CORSAIR_SSR_PAYLOADS__;

  if (!(ssrPayloads instanceof Map)) {
    if (ssrPayloads !== undefined) {
      window.__REACT_CORSAIR_SSR_PAYLOADS__ = undefined;
    }
    return null;
  }

  const payloads = [];
  const resolvers = new Map<number, (ssrPayload: SSRRoutePayload) => void>();

  window.__REACT_CORSAIR_SSR_PAYLOADS__ = {
    set(index, payloadStr) {
      const resolve = resolvers.get(index);

      if (resolve !== undefined) {
        resolve(payloadParser(payloadStr));
        resolvers.delete(index);
      }
    },
  };

  for (let i = 0; i < routeCount; i++) {
    if (ssrPayloads.has(i)) {
      payloads.push(payloadParser(ssrPayloads.get(i)));
    } else {
      payloads.push(new Promise<SSRRoutePayload>(resolve => resolvers.set(i, resolve)));
    }
  }

  return payloads;
}

/**
 * Loads route components and uses data rendered during SSR.
 */
export function hydrateRoutes(
  routeMatches: RouteMatch[],
  ssrPayloads: Array<Promise<SSRRoutePayload> | SSRRoutePayload>
): Array<Promise<RoutePayload> | RoutePayload> | null {
  return routeMatches.map((routeMatch, i) => {
    let component;

    try {
      component = routeMatch.route.getComponent();
    } catch (error) {
      return createErrorPayload(error);
    }

    if (isPromiseLike(component) || isPromiseLike(ssrPayloads[i])) {
      return Promise.all([component, ssrPayloads[i]]).then(hydratePayload, createErrorPayload);
    }

    return hydratePayload([component, ssrPayloads[i]]);
  });
}

function hydratePayload(pair: [ComponentType, SSRRoutePayload]): RoutePayload {
  return pair[1].hasError ? createOkPayload(pair[0], pair[1].data) : createErrorPayload(pair[1].error);
}

function createOkPayload(component: ComponentType, data: unknown): RoutePayload {
  return { component, data, error: undefined, hasError: false };
}

function createErrorPayload(error: unknown): RoutePayload {
  return { component: undefined, data: undefined, error, hasError: true };
}
