import { ComponentType } from 'react';
import { RouteMatch } from './matchRoutes';
import { Route } from './Route';
import { isPromiseLike } from './utils';

/**
 * A state rendered by a route component.
 */
export interface RouteState {
  /**
   * Data available in a route component.
   */
  data?: unknown;

  /**
   * An error that occurred when component and data were loaded or rendered.
   */
  error?: unknown;

  /**
   * `true` if {@link error} contains an actual error, or `false` otherwise.
   *
   * @default false
   */
  hasError?: boolean;
}

/**
 * A loaded route state and component.
 */
export interface RouteContent extends RouteState {
  /**
   * A component rendered by a route, or `undefined` if an {@link error} occurred.
   */
  component: ComponentType | undefined;
  hasError: boolean;
}

/**
 * Loads components and state for matched routes.
 */
export function loadRoutes(routeMatches: RouteMatch[], context: unknown): Array<Promise<RouteContent> | RouteContent> {
  return routeMatches.map(routeMatch => loadRoute(routeMatch.route, routeMatch.params, context));
}

/**
 * Loads a component and state for a route.
 */
export function loadRoute(route: Route, params: unknown, context: unknown): Promise<RouteContent> | RouteContent {
  let component;
  let data;

  try {
    component = route.getComponent();

    data = route.loader?.(params, context);
  } catch (error) {
    return createErrorContent(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(pair => createOkContent(pair[0], pair[1]), createErrorContent);
  }

  return createOkContent(component, data);
}

/**
 * Loads route components and uses data rendered during SSR.
 *
 * **Note:** Hydration has a side effect of overwriting the SSR state, so it is a no-op when called the second time.
 */
export function hydrateRoutes(
  routeMatches: RouteMatch[],
  stateParser: (stateStr: string) => RouteState
): Array<Promise<RouteContent> | RouteContent> | null {
  const ssrState = typeof window !== 'undefined' ? window.__REACT_CORSAIR_SSR_STATE__ : undefined;

  if (!(ssrState instanceof Map)) {
    if (ssrState !== undefined) {
      window.__REACT_CORSAIR_SSR_STATE__ = undefined;
    }
    return null;
  }

  const stateResolvers = new Map<number, (state: RouteState) => void>();

  window.__REACT_CORSAIR_SSR_STATE__ = {
    set(index, stateStr) {
      const resolveState = stateResolvers.get(index);

      if (resolveState !== undefined) {
        resolveState(stateParser(stateStr));
        stateResolvers.delete(index);
      }
    },
  };

  return routeMatches.map((routeMatch, i) => {
    let component;
    let state;

    try {
      component = routeMatch.route.getComponent();

      state = ssrState.has(i)
        ? stateParser(ssrState.get(i))
        : new Promise<RouteState>(resolve => stateResolvers.set(i, resolve));
    } catch (error) {
      return createErrorContent(error);
    }

    if (isPromiseLike(component) || isPromiseLike(state)) {
      return Promise.all([component, state]).then(hydrateContent, createErrorContent);
    }

    return hydrateContent([component, state]);
  });
}

function hydrateContent(pair: [ComponentType, RouteState]): RouteContent {
  return pair[1].hasError ? createErrorContent(pair[1].error) : createOkContent(pair[0], pair[1].data);
}

function createOkContent(component: ComponentType, data: unknown): RouteContent {
  return { component, data, error: undefined, hasError: false };
}

function createErrorContent(error: unknown): RouteContent {
  return { component: undefined, data: undefined, error, hasError: true };
}
