import { ComponentType } from 'react';
import { RouteMatch } from './matchRoutes';
import { Route } from './Route';
import { isPromiseLike } from './utils';

/**
 * A route payload passed from the server to the client during SSR.
 */
export interface SSRRoutePayload {
  /**
   * Data available in a route component.
   */
  data?: unknown;

  /**
   * An error that occurred when component and data were loaded or rendered.
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
 * Loads route components and uses data rendered during SSR.
 *
 * **Note:** Hydration has a side effect of overwriting the SSR state, so no-op when called the second time.
 */
export function hydrateRoutes(
  routeMatches: RouteMatch[],
  ssrPayloadParser: (ssrPayloadStr: string) => SSRRoutePayload
): Array<Promise<RoutePayload> | RoutePayload> | null {
  const ssrState = typeof window !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (!(ssrState instanceof Map)) {
    if (ssrState !== undefined) {
      window.__REACT_CORSAIR_SSR_STATE__ = undefined;
    }
    return null;
  }

  const resolvers = new Map<number, (ssrPayload: SSRRoutePayload) => void>();

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(index, ssrPayloadStr) {
      const resolve = resolvers.get(index);

      if (resolve !== undefined) {
        resolve(ssrPayloadParser(ssrPayloadStr));
        resolvers.delete(index);
      }
    },
  };

  return routeMatches.map((routeMatch, i) => {
    let component;
    let ssrPayload;

    try {
      component = routeMatch.route.getComponent();

      ssrPayload = ssrState.has(i)
        ? ssrPayloadParser(ssrState.get(i))
        : new Promise<SSRRoutePayload>(resolve => resolvers.set(i, resolve));
    } catch (error) {
      return createErrorPayload(error);
    }

    if (isPromiseLike(component) || isPromiseLike(ssrPayload)) {
      return Promise.all([component, ssrPayload]).then(hydratePayload, createErrorPayload);
    }

    return hydratePayload([component, ssrPayload]);
  });
}

function hydratePayload(pair: [ComponentType, SSRRoutePayload]): RoutePayload {
  return pair[1].hasError ? createErrorPayload(pair[1].error) : createOkPayload(pair[0], pair[1].data);
}

function createOkPayload(component: ComponentType, data: unknown): RoutePayload {
  return { component, data, error: undefined, hasError: false };
}

function createErrorPayload(error: unknown): RoutePayload {
  return { component: undefined, data: undefined, error, hasError: true };
}
