import { PathnameMatch } from './PathnameTemplate.js';
import { Route } from './Route.js';
import { Dict } from './types.js';

/**
 * The result of matching a route by a location.
 *
 * @group Routing
 */
export interface RouteMatch {
  /**
   * A matched route.
   */
  route: Route;

  /**
   * Parsed params extracted from a pathname and search params.
   */
  params: Dict;
}

/**
 * Looks up a route in routes that matches the pathname, and returns an array of matches for a route and its ancestors.
 *
 * @param pathname The pathname to match.
 * @param searchParams Location search params.
 * @param routes Routes to match pathname against.
 * @returns An array of route matches, can be empty if there are no matching routes.
 */
export function matchRoutes(pathname: string, searchParams: Dict, routes: readonly Route[]): RouteMatch[] {
  const cache = new Map<Route, PathnameMatch | null>();

  for (const route of routes) {
    const match = matchPathname(pathname, route, cache);

    if (match === null || match.childPathname !== '/') {
      // No match or pathname cannot be consumed by a route
      continue;
    }

    const routeMatches = getRouteMatches(route, searchParams, cache);

    if (routeMatches === null) {
      // Cannot match params, proceed to the next route
      continue;
    }

    return routeMatches;
  }

  return [];
}

function matchPathname(pathname: string, route: Route, cache: Map<Route, PathnameMatch | null>): PathnameMatch | null {
  let match = cache.get(route);

  if (match !== undefined) {
    return match;
  }

  if (route.parentRoute !== null) {
    match = matchPathname(pathname, route.parentRoute, cache);

    if (match === null) {
      return null;
    }
    pathname = match.childPathname;
  }

  match = route.pathnameTemplate.match(pathname);

  cache.set(route, match);

  return match;
}

function getRouteMatches(
  route: Route,
  searchParams: Dict,
  cache: Map<Route, PathnameMatch | null>
): RouteMatch[] | null {
  const { parentRoute, paramsAdapter } = route;

  const routeMatches = parentRoute === null ? [] : getRouteMatches(parentRoute, searchParams, cache);

  if (routeMatches === null) {
    // Parent route is not matched
    return null;
  }

  const match = cache.get(route)!;

  const pathnameParams = parentRoute === null ? match.params : { ...match.params, ...cache.get(parentRoute)!.params };

  const params =
    paramsAdapter === undefined || paramsAdapter.fromRawParams === undefined
      ? { ...searchParams, ...pathnameParams }
      : paramsAdapter.fromRawParams(searchParams, pathnameParams);

  if (params === null) {
    return null;
  }

  routeMatches.push({ route, params });

  return routeMatches;
}
