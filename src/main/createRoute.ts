import { memo } from 'react';
import { inferPathnameMatcher } from './inferPathnameMatcher';
import { inferURLComposer } from './inferURLComposer';
import { ComponentLoader, PathnameMatcher, Route, RouteOptions } from './types';
import { isPromiseLike } from './utils';

/**
 * Creates a route that maps pathname and params to a resolved result.
 *
 * @param pathname The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
 * @param componentLoader Loads the component rendered by the route.
 */
export function createRoute(pathname: string | PathnameMatcher, componentLoader: ComponentLoader): Route<void>;

/**
 * Creates a route that maps pathname and params to a resolved result.
 *
 * @param options Route options.
 * @template Params The validated route params.
 */
export function createRoute<Params = void>(options: RouteOptions<Params>): Route<Params>;

export function createRoute(
  pathnameOrOptions: string | PathnameMatcher | RouteOptions<unknown>,
  componentLoader?: ComponentLoader
): Route<any> {
  const options: RouteOptions<unknown> =
    typeof pathnameOrOptions === 'object'
      ? pathnameOrOptions
      : { pathname: pathnameOrOptions, componentLoader: componentLoader! };

  componentLoader = options.componentLoader;

  let { pathname, urlComposer } = options;
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

  return {
    pathnameMatcher,
    componentLoader: memoizeComponentLoader(componentLoader),
    dataLoader: options.dataLoader,
    paramsParser: options.paramsParser,
    urlComposer,
  };
}

function memoizeComponentLoader(componentLoader: ComponentLoader): ComponentLoader {
  let cachedComponent: ReturnType<ComponentLoader> | undefined;

  return () => {
    if (cachedComponent !== undefined) {
      return cachedComponent;
    }

    const component = componentLoader();

    if (!isPromiseLike(component)) {
      cachedComponent = memo(component);
      return cachedComponent;
    }

    cachedComponent = component.then(
      module => {
        cachedComponent = memo(module.default);
        return { default: cachedComponent };
      },
      error => {
        cachedComponent = undefined;
        throw error;
      }
    );
    return cachedComponent;
  };
}
