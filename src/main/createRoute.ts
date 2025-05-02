import { ComponentType } from 'react';
import { CONTEXT, Route } from './Route';
import { ComponentModule, Dict, RouteOptions } from './types';

/**
 * Creates a route that is rendered in an {@link Outlet} of a {@link Router}.
 *
 * @example
 * const fooRoute = createRoute({ pathname: '/foo' });
 *
 * @param options Route options.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export function createRoute<Params extends Dict = {}, Data = void, Context = any>(
  options?: RouteOptions<Params, Data, Context>
): Route<null, Params, Data, Context>;

/**
 * Creates a route that is rendered in an {@link Outlet} of a parent route.
 *
 * @example
 * const fooRoute = createRoute({ pathname: '/foo' });
 * const barRoute = createRoute(fooRoute, { pathname: '/bar' });
 *
 * @param parentRoute A parent route.
 * @param options Route options.
 * @template ParentRoute A parent route.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export function createRoute<ParentRoute extends Route, Params extends Dict = {}, Data = void>(
  parentRoute: ParentRoute,
  options?: RouteOptions<Params, Data, ParentRoute[CONTEXT]>
): Route<ParentRoute, Params, Data, ParentRoute[CONTEXT]>;

/**
 * Creates a route that is rendered in an {@link Outlet} of a {@link Router}.
 *
 * @example
 * function Foo() {
 *   return 'Hello';
 * }
 *
 * const fooRoute = createRoute('/foo', Foo);
 *
 * @param pathname A {@link RouteOptions.pathname pathname} pattern.
 * @param componentProvider A callback that returns a component that is rendered by a route, or a {@link Promise} that
 * loads a module which default-exports a component.
 * @template Params Route params.
 * @group Routing
 */
export function createRoute<Params extends Dict = {}>(
  pathname: string,
  componentProvider?: () => ComponentType | PromiseLike<ComponentModule>
): Route<null, Params, void>;

/**
 * Creates a route that is rendered in an {@link Outlet} of a parent route.
 *
 * @example
 * function Bar() {
 *   return 'Hello';
 * }
 *
 * const fooRoute = createRoute('/foo');
 * const barRoute = createRoute(fooRoute, '/bar', Bar);
 *
 * @param parentRoute A parent route.
 * @param pathname A {@link RouteOptions.pathname pathname} pattern.
 * @param componentProvider A callback that returns a component that is rendered by a route, or a {@link Promise} that
 * loads a module which default-exports a component.
 * @template ParentRoute A parent route.
 * @template Params Route params.
 * @group Routing
 */
export function createRoute<ParentRoute extends Route, Params extends Dict = {}>(
  parentRoute: ParentRoute,
  pathname: string,
  componentProvider?: () => ComponentType | PromiseLike<ComponentModule>
): Route<ParentRoute, Params, void, ParentRoute[CONTEXT]>;

export function createRoute(
  arg1: any,
  arg2?: any,
  componentProvider?: () => ComponentType | PromiseLike<ComponentModule>
): Route {
  return new Route(
    arg1 instanceof Route ? arg1 : null,

    typeof arg1 === 'string'
      ? // (pathname, componentProvider)
        {
          pathname: arg1,
          componentProvider: arg2,
        }
      : arg1 instanceof Route && typeof arg2 === 'string'
        ? // (parentRoute, pathname, componentProvider)
          {
            pathname: arg2,
            componentProvider,
          }
        : arg1 instanceof Route
          ? // (parentRoute, options)
            arg2
          : // (options)
            arg1
  );
}
