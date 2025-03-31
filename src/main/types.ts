import { ComponentType } from 'react';
import { Route } from './Route';
import { Router } from './Router';
import { RoutePresenter } from './RoutePresenter';

export interface Dict {
  [key: string]: any;
}

/**
 * A partial location or route that doesn't have any required params.
 *
 * @group Routing
 */
export type To = Partial<Location> | { getLocation(): Location };

/**
 * A location contains information about the URL path and history state.
 *
 * @group Routing
 */
export interface Location {
  /**
   * A URL pathname.
   */
  pathname: string;

  /**
   * URL search params represented as an object.
   */
  searchParams: Dict;

  /**
   * A decoded URL fragment identifier without a `#`.
   */
  hash: string;

  /**
   * An arbitrary data associated with the location.
   */
  state?: any;
}

/**
 * Non-essential {@link Location} options.
 *
 * @group Routing
 */
export interface LocationOptions {
  /**
   * A URL fragment identifier.
   *
   * If hash begins with a `#` then it is used as is. Otherwise, it is encoded using {@link !encodeURIComponent}.
   */
  hash?: string;

  /**
   * An arbitrary data associated with the location.
   */
  state?: any;
}

/**
 * An adapter that can validate and transform route params.
 *
 * @template Params Route params.
 * @see {@link jsonSearchParamsAdapter}
 * @group Routing
 */
export interface ParamsAdapter<Params> {
  /**
   * Validates and transforms params extracted from a {@link Location.pathname} and {@link Location.searchParams}.
   *
   * @param params A dictionary that contains both pathname and search params.
   * @returns Route params.
   */
  parse(params: Dict): Params;

  /**
   * Converts route params to {@link Location.pathname} params.
   *
   * @param params Route params.
   * @returns Params that should be substituted into a location pathname.
   */
  toPathnameParams?(params: Params): Dict;

  /**
   * Converts route params to {@link Location.searchParams}.
   *
   * @param params Route params.
   * @returns A dictionary that is used as {@link Location.searchParams}.
   */
  toSearchParams?(params: Params): Dict;
}

/**
 * What to render when {@link RouteOptions.lazyComponent} or {@link RouteOptions.dataLoader} are being loaded.
 *
 * <dl>
 * <dt>"loading"</dt>
 * <dd>Always render {@link RouteOptions.loadingComponent} if a route requires loading.</dd>
 * <dt>"route_loading"</dt>
 * <dd>render {@link RouteOptions.loadingComponent} only if a route is changed during navigation.</dd>
 * <dt>"avoid"</dt>
 * <dd>If there's a route that is already rendered then keep it on the screen until the new route data is loaded.</dd>
 * </dl>
 *
 * @group Routing
 */
export type LoadingAppearance = 'loading' | 'route_loading' | 'avoid';

/**
 * Where the route is rendered.
 *
 * <dl>
 * <dt>"server"</dt>
 * <dd>Route is rendered on the server during SSR and hydrated on the client.</dd>
 * <dt>"client"</dt>
 * <dd>Route is rendered on the client. Loading state is rendered on the server during SSR.</dd>
 * </dl>
 *
 * @group Routing
 */
export type RenderingDisposition = 'server' | 'client';

/**
 * Options of a {@link RouteOptions.dataLoader data loader}.
 *
 * @template Params Route params.
 * @template Context A router context.
 * @group Routing
 */
export interface DataLoaderOptions<Params, Context> {
  /**
   * Route params extracted from a location.
   */
  params: Params;

  /**
   * A router context.
   */
  context: Context;

  /**
   * A signal that is aborted if a loader result isn't needed anymore.
   */
  signal: AbortSignal;

  /**
   * `true` if a loader is called during {@link Router.prefetch prefetch}.
   */
  isPrefetch: boolean;
}

/**
 * Fallbacks that are used when a {@link RouteOptions.component} cannot be rendered.
 *
 * @group Routing
 */
export interface Fallbacks {
  /**
   * A component that is rendered when an error was thrown during route rendering.
   *
   * Use {@link useRouteError} to access the thrown error.
   *
   * A {@link Router}-level {@link errorComponent} is used only for root routes. Nested routes must specify their own
   * {@link RouteOptions.errorComponent error components}.
   *
   * Routes without an {@link errorComponent} don't have an error boundary.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link RouteOptions.lazyComponent} or a {@link RouteOptions.dataLoader} are being
   * loaded. Render a skeleton or a spinner in this component to notify user that a new route is being loaded.
   *
   * A {@link Router}-level {@link loadingComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.loadingComponent loading components}.
   *
   * Routes without a {@link loadingComponent} suspend a parent route.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link notFound} was called during route rendering or if there's no route that
   * matches the location a router was navigated to.
   *
   * Routes without {@link notFoundComponent} propagate {@link notFound} to a parent route.
   */
  notFoundComponent?: ComponentType;
}

/**
 * Options of a {@link Route}.
 *
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export interface RouteOptions<Params extends Dict, Data, Context> extends Fallbacks {
  /**
   * A URL pathname pattern.
   *
   * Pattern can include params that conform `:[A-Za-z$_][A-Za-z0-9$_]+`. For example `"/:userId"`.
   *
   * Params match a whole segment and cannot be partial. For example, `"/teams--:teamId"` is invalid and would throw
   * a {@link !SyntaxError}, while `"/teams/:teamId"` is valid.
   *
   * By default, a param matches a non-empty pathname segment. To make a param optional (so it can match an absent
   * segment) follow it by a `?` flag. For example: `"/user/:userId?"` matches both `"/user"` and `"/user/37"`.
   *
   * Static pathname segments can be optional as well: `"/project/task?/:taskId"`.
   *
   * By default, a param matches a single pathname segment. Follow a param with a `*` flag to make it match multiple
   * segments. For example: `"/:slug*"` matches `"/watch"` and `"/watch/a/movie"`. Such params are called wildcard
   * params.
   *
   * To make param both wildcard and optional, combine `*` and `?` flags: `"/:slug*?"`.
   *
   * To use `:` as a character in a pathname pattern, replace it with an {@link !encodeURIComponent encoded}
   * representation: `%3A`.
   *
   * @default "/"
   */
  pathname?: string;

  /**
   * If `true` then {@link pathname} is matched in a case-sensitive manner.
   *
   * @default false
   */
  isCaseSensitive?: boolean;

  /**
   * A component that is rendered by a route.
   *
   * If both {@link component} and {@link lazyComponent} are omitted then a route implicitly renders an {@link Outlet}.
   */
  component?: ComponentType;

  /**
   * A lazy-loaded component that is rendered by a route. A component cached forever if a returned {@link !Promise}
   * is fulfilled.
   *
   * @example
   * () => import('./UserPage')
   */
  lazyComponent?: () => PromiseLike<{ default: ComponentType }>;

  /**
   * An adapter that can validate and transform params extracted from the {@link Location.pathname} and
   * {@link Location.searchParams}.
   *
   * Params are available in route all components via {@link useRouteParams}.
   */
  paramsAdapter?: ParamsAdapter<Params> | ParamsAdapter<Params>['parse'];

  /**
   * A callback that loads data required to render a route.
   *
   * Loaded data is available in route {@link component} via {@link useRouteData}.
   *
   * @param options Loader options.
   */
  dataLoader?: (options: DataLoaderOptions<Params, Context>) => PromiseLike<Data> | Data;

  /**
   * What to render when {@link lazyComponent} or {@link dataLoader} are being loaded.
   *
   * @default "auto"
   */
  loadingAppearance?: LoadingAppearance;

  /**
   * Where the route is rendered.
   *
   * @default "server"
   */
  renderingDisposition?: RenderingDisposition;
}

/**
 * Options of a {@link Router}.
 *
 * @template Context A router context.
 * @group Routing
 */
export interface RouterOptions<Context> extends Fallbacks {
  /**
   * Routes that a router can match.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * An arbitrary context.
   */
  context: Context;
}

/**
 * An event published by a {@link Router} after a {@link Router.navigate navigation} occurs.
 *
 * @group Routing
 */
export interface NavigateEvent {
  /**
   * The event type.
   */
  type: 'navigate';

  /**
   * A router from which an event originates.
   */
  router: Router;

  /**
   * A location to which a router was navigated.
   */
  location: Location;
}

/**
 * An event published by a {@link Router} when a route component or its data are being loaded.
 *
 * @group Routing
 */
export interface LoadingEvent {
  type: 'loading';

  /**
   * A presenter from which an event originates.
   */
  presenter: RoutePresenter;
}

/**
 * An event published by a {@link Router} when a route component and its data are successfully loaded.
 *
 * @group Routing
 */
export interface ReadyEvent {
  type: 'ready';

  /**
   * A presenter from which an event originates.
   */
  presenter: RoutePresenter;
}

/**
 * An event published by a {@link Router} when an error was thrown by a component or by a data loader.
 *
 * @group Routing
 */
export interface ErrorEvent {
  /**
   * The event type.
   */
  type: 'error';

  /**
   * A presenter from which an event originates.
   */
  presenter: RoutePresenter;

  /**
   * An error that was thrown.
   */
  error: any;
}

/**
 * An event published by a {@link Router} when a {@link notFound} was called from a component or a data loader.
 *
 * @group Routing
 */
export interface NotFoundEvent {
  /**
   * The event type.
   */
  type: 'not_found';

  /**
   * A presenter from which an event originates.
   */
  presenter: RoutePresenter;
}

/**
 * An event published by a {@link Router} when a {@link redirect} was called from a component or a data loader.
 *
 * @group Routing
 */
export interface RedirectEvent {
  /**
   * The event type.
   */
  type: 'redirect';

  /**
   * A presenter from which an event originates.
   */
  presenter: RoutePresenter;

  /**
   * A location or a URL to which a redirect should be made.
   */
  to: To | string;
}

/**
 * An event published by a {@link Router}.
 *
 * @group Routing
 */
export type RouterEvent = NavigateEvent | LoadingEvent | ReadyEvent | ErrorEvent | NotFoundEvent | RedirectEvent;
