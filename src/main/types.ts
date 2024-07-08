import { ComponentType, ReactNode } from 'react';

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
   * A URL fragment identifier, beginning with "#".
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
   * If hash begins with a "#" then it is used as is. Otherwise, it is encoded using {@link !encodeURIComponent}.
   */
  hash?: string;

  /**
   * An arbitrary data associated with the location.
   */
  state?: any;
}

/**
 * A content rendered by a route:
 *
 * - An arbitrary React node (element, string, number, etc.)
 * - A function that returns a component.
 * - A function that dynamically imports a module that default-exports the component.
 *
 * @example
 * () => import('./UserPage')
 */
export type RouteContent = (() => PromiseLike<{ default: ComponentType } | ComponentType> | ComponentType) | ReactNode;

/**
 * A fallback rendered by the {@link Outlet} when {@link RouteContent} cannot be rendered for some reason.
 */
export type RouteFallback = ComponentType | ReactNode;

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
 * Options of a {@link Route}.
 *
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link dataLoader}.
 */
export interface RouteOptions<Params, Data, Context> {
  /**
   * A URL pathname segment. Leading and trailing slashes are ignored during route matching.
   *
   * @example "/foo/$bar"
   */
  pathname: string;

  /**
   * A content rendered by a route. If `undefined` then route implicitly renders {@link Outlet}.
   */
  content?: RouteContent;

  /**
   * An adapter that can validate and transform params extracted from the {@link Location.pathname} and
   * {@link Location.searchParams}. Params are available inside the {@link content} through {@link useRouteParams} hook.
   */
  paramsAdapter?: ParamsAdapter<Params> | ParamsAdapter<Params>['parse'];

  /**
   * Loads data required to render a route. The loaded data is synchronously available inside the {@link content}
   * through {@link useRouteData} hook.
   *
   * @param params Route params extracted from a location.
   * @param context A {@link RouterProps.context} provided to a {@link Router}.
   */
  dataLoader?: (params: Params, context: Context) => PromiseLike<Data> | Data;

  /**
   * A fallback that is rendered when the route {@link content} or {@link dataLoader data} are being loaded.
   */
  pendingFallback?: RouteFallback;

  /**
   * A fallback that is rendered when an error was thrown during route rendering. An error is available through
   * {@link useRouteError} hook.
   */
  errorFallback?: RouteFallback;

  /**
   * A fallback that is rendered if {@link notFound} was called during route rendering.
   */
  notFoundFallback?: RouteFallback;

  /**
   * What to render when route is being loaded.
   *
   * <dl>
   *   <dt>"fallback"</dt>
   *   <dd>A {@link pendingFallback} is always rendered if a route is matched and content or data are being loaded.</dd>
   *   <dt>"auto"</dt>
   *   <dd>If another route is currently rendered then it would be preserved until content and data of a newly matched
   *   route are being loaded. Otherwise, a {@link pendingFallback} is rendered.</dd>
   * </dl>
   *
   * @default "auto"
   */
  pendingBehavior?: 'fallback' | 'auto';
}
