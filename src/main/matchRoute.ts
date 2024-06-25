import { Route } from './Route';
import { urlSearchParamsParser } from './urlSearchParamsParser';

export interface RouteMatch {
  /**
   * The route that was matched.
   */
  route: Route;

  /**
   * The pathname that was matched.
   */
  pathname: string;

  /**
   * Parsed and validated URL parameters. Contains both pathname and search parameters.
   */
  params: any;
}

/**
 * Matches a URL with a route.
 *
 * @param url The URL or pathname to match.
 * @param routes The array of routes to which the router can navigate.
 * @param searchParamsParser The search params parser that extracts raw params from a URL search string and stringifies
 * them back.
 */
export function matchRoute(
  url: string,
  routes: Route[],
  searchParamsParser = urlSearchParamsParser
): RouteMatch | null {
  const { pathname, search } = new URL(url, 'http://undefined');

  const searchParams = searchParamsParser.parse(search);

  for (const route of routes) {
    const pathnameMatch = route['_pathnameMatcher'](pathname);

    if (pathnameMatch === null) {
      continue;
    }

    let params;

    if (route['_paramsParser'] !== undefined) {
      try {
        params = route['_paramsParser'].parse(
          pathnameMatch.params !== undefined ? { ...searchParams, ...pathnameMatch.params } : searchParams
        );
      } catch {
        continue;
      }
    }

    return {
      route,
      pathname: pathname.substring(0, pathnameMatch.index),
      params,
    };
  }
  return null;
}
