import { inferPathnameMatcher } from './inferPathnameMatcher';
import { inferURLComposer } from './inferURLComposer';
import type { PathnameMatcher, Resolver, Route, RouteOptions } from './types';
import { isPromiseLike } from './utils';

/**
 * Creates a route that maps pathname and params to a resolved result.
 *
 * @param pathname The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
 * @param resolver The value that the route resolves with, or the callback that returns the result.
 * @template Params The pathname params.
 * @template Result The resolution result.
 */
export function createRoute<Result, Params = void>(
  pathname: string | PathnameMatcher,
  resolver: Result | Resolver<Result, Params>
): Route<Result, Params>;

/**
 * Creates a route that maps pathname and params to a resolved result.
 *
 * @param options Route options.
 * @template Params The validated params.
 * @template Result The resolution result.
 */
export function createRoute<Result, Params = void>(options: RouteOptions<Result, Params>): Route<Result, Params>;

export function createRoute(
  pathnameOrOptions: string | PathnameMatcher | RouteOptions<unknown, unknown>,
  resolverOrResult?: unknown
): Route<unknown, unknown> {
  const options =
    typeof pathnameOrOptions === 'string' || typeof pathnameOrOptions === 'function'
      ? { pathname: pathnameOrOptions, resolver: resolverOrResult! }
      : pathnameOrOptions;

  resolverOrResult = options.resolver;

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

  let isCacheable;
  let resolver;

  if (typeof resolverOrResult !== 'function') {
    isCacheable = true;
    resolver = () => resolverOrResult;
  } else if (options.cacheable) {
    isCacheable = true;
    resolver = createCachedResolver(resolverOrResult as Resolver<unknown, unknown>);
  } else {
    isCacheable = false;
    resolver = resolverOrResult as Resolver<unknown, unknown>;
  }

  return {
    pathnameMatcher,
    searchParamsParser: options.searchParamsParser,
    resolver,
    urlComposer,
    paramsValidator: options.paramsValidator,
    isCacheable,
  };
}

/**
 * Caches the non-`undefined` result returned from the resolver.
 *
 * @param resolver The resolver to cache.
 */
function createCachedResolver(resolver: Resolver<unknown, unknown>): Resolver<unknown, unknown> {
  let cachedResult: unknown;

  return params => {
    if (cachedResult !== undefined || ((cachedResult = resolver(params)), !isPromiseLike(cachedResult))) {
      return cachedResult;
    }

    cachedResult = cachedResult.then(
      result => (cachedResult = result),
      error => {
        cachedResult = undefined;
        throw error;
      }
    );
    return cachedResult;
  };
}
