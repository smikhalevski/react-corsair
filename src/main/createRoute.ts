import { Route } from './Route';
import { RouteOptions } from './types';

/**
 * Creates a root route.
 */
export function createRoute<Params extends object | void = void, Data = void, Context = any>(
  options: RouteOptions<Params, Data, Context>
): Route<null, Params, Data, Context>;

/**
 * Creates a route that is rendered in the {@link Outlet} of a parent route.
 */
export function createRoute<Parent extends Route, Params extends object | void = void, Data = void>(
  parent: Parent,
  options: RouteOptions<Params, Data, Parent['_context']>
): Route<Parent, Params, Data, Parent['_context']>;

export function createRoute(parentOrOptions: Route | RouteOptions<any, any, any>, options?: any) {
  return parentOrOptions instanceof Route ? new Route(parentOrOptions, options) : new Route(null, parentOrOptions);
}
