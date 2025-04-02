/**
 * The React Corsair core and React integration hooks.
 *
 * ```ts
 * import { createRoute } from 'react-corsair';
 * ```
 *
 * @module react-corsair
 */

export { createBrowserHistory } from './history/createBrowserHistory';
export { createHashHistory } from './history/createHashHistory';
export { createMemoryHistory } from './history/createMemoryHistory';
export { jsonSearchParamsAdapter } from './history/jsonSearchParamsAdapter';
export { Link, type LinkProps } from './history/Link';
export { useHistory, HistoryProvider } from './history/useHistory';
export { useHistorySubscription } from './history/useHistorySubscription';
export { parseLocation, stringifyLocation } from './history/utils';
export { type HistoryOptions, type History, type SearchParamsAdapter } from './history/types';

export { createRoute } from './createRoute';
export { hydrateRouter, type HydrateRouterOptions } from './hydrateRouter';
export { notFound, NotFoundError } from './notFound';
export { PathnameTemplate, type PathnameMatch } from './PathnameTemplate';
export { Prefetch, type PrefetchProps } from './Prefetch';
export { redirect, Redirect } from './redirect';
export { Route, type InferLocationParams } from './Route';
export { Router } from './Router';

// --------------------
export {
  RouteController,
  type LoadingState,
  type OkState,
  type ErrorState,
  type NotFoundState,
  type RedirectState,
  type RouteState,
} from './RouteController';

export { Outlet } from './Outlet';
export { usePrefetch } from './usePrefetch';
export { useRouter, RouterProvider, type RouterProviderProps } from './useRouter';
export { useRoute } from './useRoute';

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
  type NavigateEvent,
  type LoadingEvent,
  type ReadyEvent,
  type ErrorEvent,
  type NotFoundEvent,
  type RedirectEvent,
  type RouterEvent,
} from './types';
