import { cacheResolver } from './cacheResolver';
import { inferPathnameMatcher } from './inferPathnameMatcher';
import { inferURLComposer } from './inferURLComposer';
import type { PathnameMatcher, Resolver, Route, RouteOptions } from './types';

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
) {
  const options =
    typeof pathnameOrOptions === 'string' || typeof pathnameOrOptions === 'function'
      ? { pathname: pathnameOrOptions, resolver: resolverOrResult! }
      : pathnameOrOptions;

  resolverOrResult = options.resolver;

  const resolver =
    typeof resolverOrResult !== 'function' ? () => resolverOrResult : (resolverOrResult as Resolver<unknown, unknown>);

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
    searchParamsParser: options.searchParamsParser,
    resolver: options.cacheable ? cacheResolver(resolver) : resolver,
    urlComposer,
    paramsValidator: options.paramsValidator,
  };
}
