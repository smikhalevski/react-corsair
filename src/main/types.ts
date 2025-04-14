import { ComponentType } from 'react';
import { Route } from './Route';
import { Router } from './Router';
import { RouteController } from './RouteController';

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
  state: any;
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
   * If hash begins with a `#` then it is used as is. Otherwise, it is decoded using {@link decodeURIComponent}.
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
 * What to render when {@link RouteOptions.lazyComponent lazyComponent} or {@link RouteOptions.dataLoader dataLoader}
 * are being loaded.
 *
 * <dl>
 * <dt>"loading"</dt>
 * <dd>Always render {@link RouteOptions.loadingComponent loadingComponent} if a route requires loading.</dd>
 * <dt>"route_loading"</dt>
 * <dd>Render {@link RouteOptions.loadingComponent loadingComponent} only if a route is changed during navigation.</dd>
 * <dt>"avoid"</dt>
 * <dd>If there's a route that is already rendered then keep it on the screen until the new route is loaded.</dd>
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
 * Options of a route {@link RouteOptions.dataLoader data loader}.
 *
 * @template Params Route params.
 * @template Context A router context.
 * @group Routing
 */
export interface DataLoaderOptions<Params extends Dict, Context> {
  /**
   * A router that triggered data loading.
   */
  router: Router<Context>;

  /**
   * A route for which data is loaded.
   */
  route: Route<any, Params, any, Context>;

  /**
   * Route params extracted from a location.
   */
  params: Params;

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
 * A lazily imported module that exports a React component.
 *
 * @group Routing
 */
export interface ComponentModule {
  /**
   * The exported component.
   */
  default: ComponentType;
}

/**
 * Options of a {@link Route}.
 *
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export interface RouteOptions<Params extends Dict, Data, Context> {
  /**
   * A URL pathname pattern.
   *
   * Pattern can include params that conform `:[A-Za-z$_][A-Za-z0-9$_]+`. For example `"/:userId"`.
   *
   * Params match a whole segment and cannot be partial. For example, `"/teams--:teamId"` is invalid and would throw
   * a {@link SyntaxError}, while `"/teams/:teamId"` is valid.
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
   * To use `:` as a character in a pathname pattern, replace it with an {@link encodeURIComponent encoded}
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
   * A lazy-loaded component that is rendered by a route. A component cached forever if a returned {@link Promise}
   * is fulfilled.
   *
   * @example
   * () => import('./UserPage')
   */
  lazyComponent?: () => PromiseLike<ComponentModule>;

  /**
   * An adapter that can validate and transform params extracted from the {@link Location.pathname} and
   * {@link Location.searchParams}.
   *
   * Params are available in route all components via {@link useRoute useRoute().params}.
   */
  paramsAdapter?: ParamsAdapter<Params> | ParamsAdapter<Params>['parse'];

  /**
   * A callback that loads data required to render a route.
   *
   * Loaded data is available in route {@link component} via {@link useRoute useRoute().data}.
   *
   * @param options Loader options.
   */
  dataLoader?: (options: DataLoaderOptions<Params, Context>) => PromiseLike<Data> | Data;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   *
   * Routes without an {@link errorComponent} don't have an error boundary.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link RouteOptions.lazyComponent lazyComponent} or
   * a {@link RouteOptions.dataLoader dataLoader} are being loaded. Render a skeleton or a spinner in this component
   * to notify user that a new route is being loaded.
   *
   * Routes without a {@link loadingComponent} suspend a parent route.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link react-corsair!notFound notFound} was called during route loading or
   * rendering or if there's no route that matches the location a router was navigated to.
   *
   * Routes without {@link notFoundComponent} propagate {@link react-corsair!notFound notFound} to a parent route.
   */
  notFoundComponent?: ComponentType;

  /**
   * What to render when {@link lazyComponent} or {@link dataLoader} are being loaded.
   *
   * If not specified then {@link RouterOptions.loadingAppearance} is used instead.
   */
  loadingAppearance?: LoadingAppearance;

  /**
   * Where the route is rendered.
   *
   * If not specified then {@link RouterOptions.renderingDisposition} is used instead.
   */
  renderingDisposition?: RenderingDisposition;
}

/**
 * Options of a {@link Router}.
 *
 * @template Context A router context.
 * @group Routing
 */
export interface RouterOptions<Context = void> {
  /**
   * Routes that a router can match.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * A context provided to {@link RouteOptions.dataLoader route data loaders}.
   */
  context?: Context;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   *
   * This component is used only for root routes that don't specify their own
   * {@link RouteOptions.errorComponent errorComponent}.
   *
   * Routes without an {@link errorComponent} don't have an error boundary.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link RouteOptions.lazyComponent lazyComponent} or
   * a {@link RouteOptions.dataLoader dataLoader} are being loaded. Render a skeleton or a spinner in this component
   * to notify user that a new route is being loaded.
   *
   * This component is used only for root routes that don't specify their own
   * {@link RouteOptions.loadingComponent loadingComponent}.
   *
   * Routes without a {@link loadingComponent} suspend a parent route.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link react-corsair!notFound notFound} was called during route loading or
   * rendering or if there's no route that matches the location a router was navigated to.
   *
   * This component is used only for root routes that don't specify their own
   * {@link RouteOptions.notFoundComponent notFoundComponent}.
   *
   * Routes without {@link notFoundComponent} propagate {@link react-corsair!notFound notFound} to a parent route.
   */
  notFoundComponent?: ComponentType;

  /**
   * What to render when {@link RouteOptions.lazyComponent lazyComponent} or {@link RouteOptions.dataLoader dataLoader}
   * are being loaded.
   *
   * This is the default setting for all routes that don't specify their own
   * {@link RouteOptions.loadingAppearance loadingAppearance}.
   *
   * @default "route_loading"
   */
  loadingAppearance?: LoadingAppearance;

  /**
   * Where the route is rendered.
   *
   * This is the default setting for all routes that don't specify their own
   * {@link RouteOptions.renderingDisposition renderingDisposition}.
   *
   * @default "server"
   */
  renderingDisposition?: RenderingDisposition;
}

/**
 * Options provided to {@link Router.navigate}.
 *
 * @group Routing
 */
export interface NavigateOptions {
  /**
   * If `true` then route interception is bypassed during navigation.
   *
   * @default false
   */
  isInterceptionBypassed?: boolean;
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
   * The root controller to which router was navigated, or `null` if no matching route was found.
   */
  controller: RouteController | null;

  /**
   * A router from which an event originates.
   */
  router: Router;

  /**
   * A location to which a router was navigated.
   */
  location: Location;

  /**
   * `true` if the {@link controller} rendering was intercepted.
   *
   * @see {@link Router.cancelInterception}
   */
  isIntercepted: boolean;
}

/**
 * An event published by a {@link Router} when a route component or its data are being loaded.
 *
 * @group Routing
 */
export interface LoadingEvent {
  type: 'loading';

  /**
   * A controller from which an event originates.
   */
  controller: RouteController;
}

/**
 * An event published by a {@link Router} when a route loading was aborted.
 *
 * @group Routing
 */
export interface AbortedEvent {
  type: 'aborted';

  /**
   * A controller from which an event originates.
   */
  controller: RouteController;
}

/**
 * An event published by a {@link Router} when a route component and its data are successfully loaded.
 *
 * @group Routing
 */
export interface ReadyEvent {
  type: 'ready';

  /**
   * A controller from which an event originates.
   */
  controller: RouteController;
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
   * A controller from which an event originates.
   */
  controller: RouteController;

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
   * A controller from which an event originates.
   */
  controller: RouteController;
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
   * A controller from which an event originates.
   */
  controller: RouteController;

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
export type RouterEvent =
  | NavigateEvent
  | LoadingEvent
  | AbortedEvent
  | ReadyEvent
  | ErrorEvent
  | NotFoundEvent
  | RedirectEvent;

/**
 * The state of a route that is being actively loaded.
 *
 * @group Routing
 */
export interface LoadingState {
  /**
   * The route status.
   */
  status: 'loading';
}

/**
 * The state of a route for which the component and data were loaded.
 *
 * @template Data Data loaded by a route.
 * @group Routing
 */
export interface ReadyState<Data> {
  /**
   * The route status.
   */
  status: 'ready';

  /**
   * The data loaded for a route, or `undefined` if route has no {@link RouteOptions.dataLoader dataLoader}.
   */
  data: Data;
}

/**
 * The state of a route which has thrown an error during rendering or from a data loader.
 *
 * @group Routing
 */
export interface ErrorState {
  /**
   * The route status.
   */
  status: 'error';

  /**
   * A thrown error.
   */
  error: any;
}

/**
 * The state of a route that was marked as not found.
 *
 * @group Routing
 */
export interface NotFoundState {
  /**
   * The route status.
   */
  status: 'not_found';
}

/**
 * The state of a route that has requested a redirect.
 *
 * @group Routing
 */
export interface RedirectState {
  /**
   * The route status.
   */
  status: 'redirect';

  /**
   * A location to redirect to.
   */
  to: Location | string;
}

/**
 * State used by a {@link RouteController}.
 *
 * @template Data Data loaded by a route.
 * @group Routing
 */
export type RouteState<Data = any> = LoadingState | ReadyState<Data> | ErrorState | NotFoundState | RedirectState;
