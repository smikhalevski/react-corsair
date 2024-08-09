import { ComponentType } from 'react';

export interface Dict {
  [key: string]: any;
}

/**
 * A location or route.
 */
export type To = Location | { getLocation(): Location };

/**
 * A location contains information about the URL path and history state.
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
 * What to render when {@link RouteOptions.lazyComponent} or {@link RouteOptions.loader} are being loaded.
 *
 * <dl>
 * <dt>"loading"</dt>
 * <dd>A {@link RouteOptions.loadingComponent} is always rendered if a route is matched and component or loader are
 * being loaded.</dd>
 * <dt>"auto"</dt>
 * <dd>If another route is currently rendered then it would be preserved until component and loader of a newly matched
 * route are being loaded. Otherwise, a {@link RouteOptions.loadingComponent} is rendered.</dd>
 * </dl>
 */
export type LoadingAppearance = 'loading' | 'auto';

/**
 * Options of a {@link Route}.
 *
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link loader}.
 */
export interface RouteOptions<Params, Data, Context> {
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
   */
  paramsAdapter?: ParamsAdapter<Params> | ParamsAdapter<Params>['parse'];

  /**
   * Loads data required to render a route.
   *
   * @param params Route params extracted from a location.
   * @param context A {@link RouterProps.context} provided to a {@link Router}.
   */
  loader?: (params: Params, context: Context) => PromiseLike<Data> | Data;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link lazyComponent} or {@link loader} are being loaded. Render a skeleton or
   * a spinner in this component to notify user that a new route is being loaded.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link notFound} was called during route rendering.
   */
  notFoundComponent?: ComponentType;

  /**
   * What to render when {@link lazyComponent} or {@link loader} are being loaded.
   *
   * @default "auto"
   */
  loadingAppearance?: LoadingAppearance;
}
