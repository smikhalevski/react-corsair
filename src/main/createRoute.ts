import { ComponentType } from 'react';
import { Route } from './Route';
import { RouteOptions } from './types';

/**
 * Creates a route that is rendered in the {@link Outlet} of a {@link Router}.
 *
 * @param options Route options.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
 */
export function createRoute<Params extends object | void = object | void, Data = void, Context = any>(
  options?: RouteOptions<Params, Data, Context>
): Route<null, Params, Data, Context>;

/**
 * Creates a route that is rendered in the {@link Outlet} of a parent route.
 *
 * @param parent A parent route.
 * @param options Route options.
 * @template Parent A parent route.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
 */
export function createRoute<Parent extends Route, Params extends object | void = object | void, Data = void>(
  parent: Parent,
  options?: RouteOptions<Params, Data, Parent['_context']>
): Route<Parent, Params, Data, Parent['_context']>;

/**
 * Creates a route that is rendered in the {@link Outlet} of a {@link Router}.
 *
 * @param pathname A URL {@link RouteOptions.pathname pathname} pattern.
 * @param component A component that is rendered by a route.
 * @template Params Route params.
 */
export function createRoute<Params extends object | void = object | void>(
  pathname: string,
  component?: ComponentType
): Route<null, Params, void>;

/**
 * Creates a route that is rendered in the {@link Outlet} of a parent route.
 *
 * @param parent A parent route.
 * @param pathname A URL {@link RouteOptions.pathname pathname} pattern.
 * @param component A component that is rendered by a route.
 * @template Parent A parent route.
 * @template Params Route params.
 */
export function createRoute<Parent extends Route, Params extends object | void = object | void>(
  parent: Parent,
  pathname: string,
  component?: ComponentType
): Route<Parent, Params, void>;

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
        ? // (parent, pathname, component)
          {
            pathname: arg2,
            component,
          }
        : arg1 instanceof Route
          ? // (parent, options)
            arg2
          : // (options)
            arg1
  );
}
