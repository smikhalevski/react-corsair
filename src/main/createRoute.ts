import { createElement, memo, ReactElement } from 'react';
import { inferPathnameMatcher } from './inferPathnameMatcher';
import { inferURLComposer } from './inferURLComposer';
import { ComponentLoader, PathnameMatcher, Route, RouteOptions } from './types';
import { isPromiseLike } from './utils';

/**
 * Creates a route that maps pathname and params to a component.
 *
 * @param pathname The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
 * @param componentLoader Loads the component rendered by the route.
 */
export function createRoute(pathname: string | PathnameMatcher, componentLoader: ComponentLoader): Route<void>;

/**
 * Creates a route that maps pathname and params to a component.
 *
 * @param options Route options.
 * @template Params The validated route params.
 */
export function createRoute<Params = void>(options: RouteOptions<Params>): Route<Params>;

export function createRoute(
  pathnameOrOptions: string | PathnameMatcher | RouteOptions<unknown>,
  componentLoader?: ComponentLoader
): Route<any> {
  const options =
    typeof pathnameOrOptions === 'string' || typeof pathnameOrOptions === 'function'
      ? { pathname: pathnameOrOptions, componentLoader: componentLoader! }
      : pathnameOrOptions;

  let { pathname, urlComposer, paramsParser, dataLoader } = options;
  let pathnameMatcher: PathnameMatcher;

  if (typeof pathname === 'string') {
    pathnameMatcher = inferPathnameMatcher(pathname, options.slashSensitive);

    urlComposer ||= inferURLComposer(pathname);
  } else {
    pathnameMatcher = pathname;

    if (urlComposer === undefined) {
      throw new Error('Cannot infer urlComposer from the pathname parser. The urlComposer option is required.');
    }
  }

  const renderer = createRenderer(options.componentLoader);

  return {
    pathnameMatcher,
    renderer: params => {
      const element = renderer();
      const promise = dataLoader?.(params);

      if (isPromiseLike(element) || promise !== undefined) {
        return Promise.all([element, promise]).then(([element]) => element);
      }
      return element;
    },
    paramsParser: typeof paramsParser === 'function' ? { parse: paramsParser } : paramsParser,
    urlComposer,
  };
}

function createRenderer(componentLoader: ComponentLoader): () => PromiseLike<ReactElement> | ReactElement {
  let element: PromiseLike<ReactElement> | ReactElement | undefined;

  return () => {
    if (element !== undefined) {
      return element;
    }

    const component = componentLoader();

    if (!isPromiseLike(component)) {
      element = createElement(memo(component));
      return element;
    }

    element = component.then(
      module => {
        element = createElement(memo(module.default));
        return element;
      },
      error => {
        element = undefined;
        throw error;
      }
    );
    return element;
  };
}
