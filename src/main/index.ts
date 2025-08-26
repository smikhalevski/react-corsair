/**
 * The React Corsair core and React integration hooks.
 *
 * ```ts
 * import { createRoute } from 'react-corsair';
 * import FooPage from './FooPage.js';
 *
 * const fooRoute = createRoute('/foo', FooPage);
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
export {
  type AbortedEvent,
  type ComponentModule,
  type DataLoaderOptions,
  type ErrorEvent,
  type ErrorState,
  type LoadingAppearance,
  type LoadingEvent,
  type LoadingState,
  type Location,
  type LocationOptions,
  type NavigateEvent,
  type NavigateOptions,
  type NotFoundEvent,
  type NotFoundState,
  type ParamsAdapter,
  type ParamsAdapterLike,
  type ReadyEvent,
  type ReadyState,
  type RedirectEvent,
  type RedirectState,
  type RenderingDisposition,
  type RouteOptions,
  type RouteState,
  type RouterEvent,
  type RouterOptions,
  type Serializer,
  type To,
} from './types.js';
