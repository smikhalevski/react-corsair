import { RawParams, Route } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';

export interface RouteMatch {
  /**
   * The route that was matched.
   */
  route: Route<any>;

  /**
   * The pathname that was matched.
   */
  pathname: string;

  /**
   * Parsed and validated URL parameters. Contains both pathname and search parameters.
   */
  params: RawParams;
}

/**
 * Matches a URL with a route.
 *
 * @param url The URL or pathname to match.
 * @param routes The array of routes to which the router can navigate.
 * @param searchParamsParser The search params parser that extracts raw params from a URL search string and stringifies
 * them back. It is used if a route doesn't define {@link RouteOptions.searchParamsParser its own params parser}.
 */
export function matchRoute(
  url: string | URL | Location,
  routes: Route<any>[],
  searchParamsParser = urlSearchParamsParser
): RouteMatch | null {
  url = typeof url === 'string' ? new URL(url, 'http://undefined') : url;

  const searchParams = searchParamsParser.parse(url.search);

  for (const route of routes) {
    const pathnameMatch = route.pathnameMatcher(url.pathname);

    if (pathnameMatch === null) {
      continue;
    }

    const pathname = pathnameMatch.pathname;

    let params;

    if (route.paramsParser !== undefined) {
      params = pathnameMatch.params !== undefined ? { ...searchParams, ...pathnameMatch.params } : searchParams;

      try {
        params = route.paramsParser.parse(params);
      } catch {
        continue;
      }
    }

    return { route, pathname, params };
  }
  return null;
}
