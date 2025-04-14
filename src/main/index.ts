/**
 * The React Corsair core and React integration hooks.
 *
 * ```ts
 * import { createRoute } from 'react-corsair';
 *
 * const fooRoute = createRoute('/foo', () => import('./Foo.js'));
 * ```
 *
 * @module react-corsair
 */

export { createRoute } from './createRoute';
export { hydrateRouter, type HydrateRouterOptions } from './hydrateRouter';
export { type RouteMatch } from './matchRoutes';
export { notFound, NOT_FOUND } from './notFound';
export { Outlet, RouteOutlet, type RouteOutletProps } from './Outlet';
export { PathnameTemplate, type PathnameMatch } from './PathnameTemplate';
export { Prefetch, type PrefetchProps } from './Prefetch';
export { redirect, Redirect } from './Redirect';
export { Route, type InferLocationParams } from './Route';
export { Router } from './Router';
export { RouteController } from './RouteController';
export { useInlineRoute } from './useInlineRoute';
export { useInterceptedRoute } from './useInterceptedRoute';
export { usePrefetch } from './usePrefetch';
export { useRoute } from './useRoute';
export { useRouter, RouterProvider, type RouterProviderProps } from './useRouter';
export type * from './types';
