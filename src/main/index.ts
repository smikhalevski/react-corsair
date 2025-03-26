export { createBrowserHistory } from './history/createBrowserHistory';
export { createHashHistory } from './history/createHashHistory';
export { createMemoryHistory } from './history/createMemoryHistory';
export {
  createURLSearchParamsAdapter,
  type NameEncoder,
  type URLSearchParamsAdapterOptions,
} from './history/createURLSearchParamsAdapter';
export { Link, type LinkProps } from './history/Link';
export { useHistory, HistoryProvider } from './history/useHistory';
export { useHistorySubscription } from './history/useHistorySubscription';
export { parseLocation, stringifyLocation } from './history/utils';
export { type HistoryOptions, type History, type SearchParamsAdapter } from './history/types';

export { createRoute } from './__createRoute';
export { notFound, NotFoundError } from './__notFound';
export { Outlet } from './Outlet';
export { PathnameTemplate, type PathnameMatch } from './__PathnameTemplate';
export { redirect, Redirect } from './__redirect';
export { Route, type InferData, type InferContext, type InferLocationParams } from './__Route';
export { useRouter } from './useRouter';
export { usePrefetch } from './usePrefetch';
export { Router } from './Router';
export { RouterProvider } from './RouterProvider';
export { useRouteParams, useRouteData, useRouteError } from './hooks';

export type {
  To,
  Location,
  LocationOptions,
  RouteOptions,
  ParamsAdapter,
  LoadingAppearance,
  RenderingDisposition,
  FallbackOptions,
  RouterOptions,
  DataLoaderOptions,
  RouteState,
  Dict,
} from './types';
export { Prefetch, type PrefetchProps } from './Prefetch';

export { urlSearchParamsAdapter } from './history/createURLSearchParamsAdapter';
