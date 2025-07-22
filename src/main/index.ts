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

export { Outlet } from './outlet/Outlet.js';
export { RouteOutlet, type RouteOutletProps } from './outlet/RouteOutlet.js';
export { createRoute } from './createRoute.js';
export { hydrateRouter, type HydrateRouterOptions } from './hydrateRouter.js';
export { type RouteMatch } from './matchRoutes.js';
export { notFound, NotFoundError } from './notFound.js';
export { PathnameTemplate, type PathnameMatch } from './PathnameTemplate.js';
export { redirect, Redirect } from './Redirect.js';
export { Route } from './Route.js';
export { RouteController } from './RouteController.js';
export { Router } from './Router.js';
export { useInlineRoute } from './useInlineRoute.js';
export { useInterceptedRoute } from './useInterceptedRoute.js';
export { usePrefetch, Prefetch, type PrefetchProps } from './usePrefetch.js';
export { useRoute } from './useRoute.js';
export { useRouter, RouterProvider, type RouterProviderProps } from './useRouter.js';
export type {
  AbortedEvent,
  ComponentModule,
  DataLoaderOptions,
  ErrorEvent,
  ErrorState,
  LoadingAppearance,
  LoadingEvent,
  LoadingState,
  Location,
  LocationOptions,
  NavigateEvent,
  NavigateOptions,
  NotFoundEvent,
  NotFoundState,
  ParamsAdapter,
  ParamsAdapterLike,
  ReadyEvent,
  ReadyState,
  RedirectEvent,
  RedirectState,
  RenderingDisposition,
  RouteOptions,
  RouteState,
  RouterEvent,
  RouterOptions,
  To,
} from './types.js';
