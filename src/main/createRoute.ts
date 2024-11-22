import { ComponentType } from 'react';
import { InferContext, Route } from './Route';
import { RouteOptions } from './types';

/**
 * Creates a route that is rendered in an {@link Outlet} of a {@link Router}.
 *
 * @param options Route options.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export function createRoute<Params extends object | void = object | void, Data = void, Context = any>(
  options?: RouteOptions<Params, Data, Context>
): Route<null, Params, Data, Context>;

/**
 * Creates a route that is rendered in an {@link Outlet} of a parent route.
 *
 * @param parentRoute A parent route.
 * @param options Route options.
 * @template ParentRoute A parent route.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export function createRoute<ParentRoute extends Route, Params extends object | void = object | void, Data = void>(
  parentRoute: ParentRoute,
  options?: RouteOptions<Params, Data, InferContext<ParentRoute>>
): Route<ParentRoute, Params, Data, InferContext<ParentRoute>>;

/**
 * Creates a route that is rendered in an {@link Outlet} of a {@link Router}.
 *
 * @param pathname A {@link RouteOptions.pathname pathname} pattern.
 * @param component A component that is rendered by a route.
 * @template Params Route params.
 * @group Routing
 */
export function createRoute<Params extends object | void = object | void>(
  pathname: string,
  component?: ComponentType
): Route<null, Params, void>;

/**
 * Creates a route that is rendered in an {@link Outlet} of a parent route.
 *
 * @param parentRoute A parent route.
 * @param pathname A {@link RouteOptions.pathname pathname} pattern.
 * @param component A component that is rendered by a route.
 * @template ParentRoute A parent route.
 * @template Params Route params.
 * @group Routing
 */
export function createRoute<ParentRoute extends Route, Params extends object | void = object | void>(
  parentRoute: ParentRoute,
  pathname: string,
  component?: ComponentType
): Route<ParentRoute, Params, void>;

export function createRoute(arg1: any, arg2?: any, component?: ComponentType): Route {
  return new Route(
    arg1 instanceof Route ? arg1 : null,

    typeof arg1 === 'string'
      ? // (pathname, component)
        {
          pathname: arg1,
          component: arg2,
        }
      : arg1 instanceof Route && typeof arg2 === 'string'
        ? // (parentRoute, pathname, component)
          {
            pathname: arg2,
            component,
          }
        : arg1 instanceof Route
          ? // (parentRoute, options)
            arg2
          : // (options)
            arg1
  );
}
