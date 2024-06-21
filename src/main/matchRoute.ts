import { RawParams, Route } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';
import { isPromiseLike } from './utils';

export interface RouteMatch<Result> {
  /**
   * The route that was matched.
   */
  route: Route<Result, any>;

  /**
   * The pathname that was matched.
   */
  pathname: string;

  /**
   * Parsed and validated URL parameters. Contains both pathname and search parameters.
   */
  params: RawParams;

  /**
   * The resolved route result.
   */
  result: Result;
}

/**
 * Matches a URL with a route.
 *
 * @param url The URL or pathname to match.
 * @param routes The array of routes to which the router can navigate.
 * @param searchParamsParser The search params parser that extracts raw params from a URL search string and stringifies
 * them back. It is used if a route doesn't define {@link RouteOptions.searchParamsParser its own params parser}.
 */
export function matchRoute<Result>(
  url: URL | string,
  routes: Route<Result, any>[],
  searchParamsParser = urlSearchParamsParser
): Promise<RouteMatch<Result> | undefined> | RouteMatch<Result> | undefined {
  url = typeof url === 'string' ? new URL(url, 'http://undefined') : url;

  let promise: Promise<RouteMatch<Result> | undefined> | undefined;

  for (const route of routes) {
    const pathnameMatch = route.pathnameMatcher(url.pathname);

    if (pathnameMatch === undefined) {
      // Non-matching pathname
      continue;
    }

    const pathname = pathnameMatch.pathname;

    let params = undefined;

    if (route.paramsValidator !== undefined) {
      const searchParams = (route.searchParamsParser || searchParamsParser).parse(url.search);

      if (searchParams === undefined) {
        // Non-matching search params
        continue;
      }

      params = (0, route.paramsValidator)(
        pathnameMatch.params !== undefined ? { ...searchParams, ...pathnameMatch.params } : searchParams
      );

      if (params === undefined) {
        // Invalid params
        continue;
      }
    }

    const result = route.resolver(params);

    if (result === undefined) {
      // Not resolvable
      continue;
    }

    if (promise !== undefined || isPromiseLike(result)) {
      // Enqueue resolvers
      promise = (promise || Promise.resolve()).then(
        routeMatch =>
          routeMatch ||
          Promise.resolve(result).then(result =>
            result === undefined ? undefined : { route, pathname, result, params }
          )
      );
      continue;
    }

    return { route, pathname, result, params };
  }

  return promise;
}
