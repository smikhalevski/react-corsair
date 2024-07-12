import { PathnameMatch } from './PathnameAdapter';
import { Route } from './Route';
import { Dict } from './types';

export interface RouteMatch {
  /**
   * A matched route.
   */
  route: Route;

  /**
   * Parsed params extracted from a pathname and search params.
   */
  params: object;
}

/**
 * Looks up a route in routes that matches the pathname, and returns the array of its ancestors and corresponding parsed
 * params.
 *
 * @param pathname The pathname to match.
 * @param searchParams Location search params.
 * @param routes Routes to match pathname against.
 */
export function matchRoutes(pathname: string, searchParams: Dict, routes: Route[]): RouteMatch[] | null {
  const cache = new Map<Route, PathnameMatch | null>();

  for (const route of routes) {
    const match = matchPathname(pathname, route, cache);

    if (match === null || match.childPathname !== '/') {
      // No match or pathname cannot be consumed by a route
      continue;
    }
    return getRouteMatches(route, searchParams, cache);
  }

  return null;
}

function matchPathname(pathname: string, route: Route, cache: Map<Route, PathnameMatch | null>): PathnameMatch | null {
  let match = cache.get(route);

  if (match !== undefined) {
    return match;
  }

  if (route.parent !== null) {
    match = matchPathname(pathname, route.parent, cache);

    if (match === null) {
      return null;
    }
    pathname = match.childPathname;
  }

  match = route.pathnameAdapter.match(pathname);

  cache.set(route, match);

  return match;
}

function getRouteMatches(route: Route, searchParams: Dict, cache: Map<Route, PathnameMatch | null>): RouteMatch[] {
  const routeMatches = route.parent === null ? [] : getRouteMatches(route.parent, searchParams, cache);

  const match = cache.get(route)!;

  const params =
    route.paramsAdapter === undefined
      ? match.params || {}
      : route.paramsAdapter.parse({ ...searchParams, ...match.params });

  routeMatches.unshift({ route, params });

  return routeMatches;
}
