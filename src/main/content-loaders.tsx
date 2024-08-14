import React, { ComponentType, ReactElement } from 'react';
import { RouteMatch } from './matchRoutes';
import { RouteState } from './types';
import { useInternalRouter } from './useInternalRouter';
import { isPromiseLike } from './utils';

/**
 * A content required to render a route.
 */
export interface RouteContent {
  component: ComponentType | undefined;
  data: unknown;
  error: unknown;
  hasError: boolean;
}

export function loadRoutes(routeMatches: RouteMatch[], context: unknown): Array<Promise<RouteContent> | RouteContent> {
  return routeMatches.map(routeMatch => loadRoute(routeMatch, context));
}

/**
 * Unconditionally loads route content.
 */
export function loadRoute(routeMatch: RouteMatch, context: unknown): Promise<RouteContent> | RouteContent {
  let component;
  let data;

  try {
    component = routeMatch.route.getComponent();

    data = routeMatch.route.loader?.(routeMatch.params, context);
  } catch (error) {
    return createErrorContent(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(pair => createOkContent(pair[0], pair[1]), createErrorContent);
  }

  return createOkContent(component, data);
}

/**
 * Called exclusively on the server.
 *
 * Loads route contents for server-rendered routes.
 */
export function loadServerRoutes(
  routeMatches: RouteMatch[],
  context: unknown
): Array<Promise<RouteContent> | RouteContent> {
  const contents = [];

  for (const routeMatch of routeMatches) {
    if (routeMatch.route.renderingDisposition !== 'server') {
      break;
    }
    contents.push(loadRoute(routeMatch, context));
  }

  return contents;
}

/**
 * Called exclusively on the client.
 *
 * Tries to hydrate routes rendered by a router during SSR, or loads routes unconditionally.
 */
export function hydrateRoutes(
  routerId: string,
  routeMatches: RouteMatch[],
  context: unknown,
  stateParser: (stateStr: string) => RouteState = JSON.parse
): Array<Promise<RouteContent> | RouteContent> {
  const stateStrs = window.__REACT_CORSAIR_SSR_STATE__?.[routerId];

  if (!(stateStrs instanceof Map)) {
    // No SSR state, already hydrated, or router didn't render any routes during SSR
    return loadRoutes(routeMatches, context);
  }

  const resolvers = new Map<number, (state: RouteState) => void>();

  window.__REACT_CORSAIR_SSR_STATE__![routerId] = {
    set(index, stateStr) {
      const resolve = resolvers.get(index);

      if (resolve !== undefined) {
        resolve(stateParser(stateStr));
        resolvers.delete(index);
      }
    },
  };

  let isHydrated = true;

  return routeMatches.map((routeMatch, i) => {
    if (!isHydrated || routeMatch.route.renderingDisposition !== 'server') {
      // Client routes and their children are always loaded
      isHydrated = false;
      return loadRoute(routeMatch, context);
    }

    let component;
    let state;

    try {
      component = routeMatch.route.getComponent();

      state = stateStrs.has(i)
        ? stateParser(stateStrs.get(i))
        : new Promise<RouteState>(resolve => resolvers.set(i, resolve));
    } catch (error) {
      return createErrorContent(error);
    }

    if (isPromiseLike(component) || isPromiseLike(state)) {
      return Promise.all([component, state]).then(hydrateContent, createErrorContent);
    }

    return hydrateContent([component, state]);
  });
}

/**
 * A script tag that must be rendered by a {@link Router} during SSR to initiate route hydration on the client.
 */
export function RouterHydrationScript(): ReactElement {
  const { routerId, nonce } = useInternalRouter().props;

  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html:
          '(window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||{})[' +
          JSON.stringify(routerId) +
          ']=new Map();' +
          'var e=document.currentScript;e&&e.parentNode.removeChild(e);',
      }}
    />
  );
}

interface RouteHydrationScriptProps {
  index: number;
  state: RouteState;
}

/**
 * A script tag that must be rendered by an {@link Outlet} during SSR.
 */
export function RouteHydrationScript(props: RouteHydrationScriptProps): ReactElement | null {
  const { routerId, nonce, stateStringifier = JSON.stringify } = useInternalRouter().props;

  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html:
          'window.__REACT_CORSAIR_SSR_STATE__&&window.__REACT_CORSAIR_SSR_STATE__[' +
          JSON.stringify(routerId) +
          '].set(' +
          props.index +
          ',' +
          JSON.stringify(stateStringifier(props.state)) +
          ');' +
          'var e=document.currentScript;e&&e.parentNode.removeChild(e);',
      }}
    />
  );
}

function hydrateContent(pair: [ComponentType, RouteState]): RouteContent {
  return pair[1].hasError ? createErrorContent(pair[1].error) : createOkContent(pair[0], pair[1].data);
}

export function createOkContent(component: ComponentType, data: unknown): RouteContent {
  return { component, data, error: undefined, hasError: false };
}

export function createErrorContent(error: unknown): RouteContent {
  return { component: undefined, data: undefined, error, hasError: true };
}
