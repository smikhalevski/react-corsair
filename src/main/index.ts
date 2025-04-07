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
export { notFound } from './notFound';
export { Outlet, RouteOutlet, type RouteOutletProps } from './Outlet';
export { PathnameTemplate, type PathnameMatch } from './PathnameTemplate';
export { Prefetch, type PrefetchProps } from './Prefetch';
export { redirect, Redirect } from './redirect';
export { Route, type InferLocationParams } from './Route';
export { Router } from './Router';
export {
  RouteController,
  type LoadingState,
  type OkState,
  type ErrorState,
  type NotFoundState,
  type RedirectState,
  type RouteState,
} from './RouteController';
export { useInterceptedRoute } from './useInterceptedRoute';
export { usePrefetch } from './usePrefetch';
export { useRoute } from './useRoute';
export { useRouter, RouterProvider, type RouterProviderProps } from './useRouter';
export {
  type To,
  type Location,
  type LocationOptions,
  type ParamsAdapter,
  type LoadingAppearance,
  type RenderingDisposition,
  type DataLoaderOptions,
  type Fallbacks,
  type ComponentModule,
  type RouteOptions,
  type RouterOptions,
  type NavigateOptions,
  type NavigateEvent,
  type LoadingEvent,
  type AbortedEvent,
  type ReadyEvent,
  type ErrorEvent,
  type NotFoundEvent,
  type RedirectEvent,
  type RouterEvent,
} from './types';
