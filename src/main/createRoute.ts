import { Route } from './Route';
import { RouteOptions } from './types';

/**
 * Creates a route.
 *
 * @param options Route options.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.dataLoader}.
 */
export function createRoute<Params extends object | void = void, Data = void, Context = any>(
  options: RouteOptions<Params, Data, Context>
): Route<null, Params, Data, Context>;

/**
 * Creates a route that is rendered in the {@link Outlet} of a parent route.
 *
 * @param parent A parent route.
 * @param options Route options.
 * @template Parent A parent route.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.dataLoader}.
 */
export function createRoute<Parent extends Route, Params extends object | void = void, Data = void>(
  parent: Parent,
  options: RouteOptions<Params, Data, Parent['_context']>
): Route<Parent, Params, Data, Parent['_context']>;

export function createRoute(parentOrOptions: Route | RouteOptions<any, any, any>, options?: any) {
  return parentOrOptions instanceof Route ? new Route(parentOrOptions, options) : new Route(null, parentOrOptions);
}
