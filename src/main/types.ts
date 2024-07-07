import { ComponentType, ReactNode } from 'react';

export interface Dict {
  [key: string]: any;
}

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
   * A URL fragment identifier.
   */
  hash: string;

  /**
   * An arbitrary data associated with the location.
   */
  state?: any;
}

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
 * You can call {@link redirect} in to trigger navigation. In this case
 *
 * @example
 * () => import('./UserPage')
 */
export type RouteContent = (() => PromiseLike<{ default: ComponentType } | ComponentType> | ComponentType) | ReactNode;

/**
 * Adapter that can validate route params.
 */
export interface ParamsAdapter<Params> {
  /**
   * Validates params extracted from a {@link Location.pathname} and {@link Location.searchParams}.
   */
  parse(params: Dict): Params;

  /**
   * Converts route params to {@link Location.searchParams}.
   */
  toSearchParams?(params: Params): Dict;
}

export interface RouteOptions<Params, Data, Context> {
  /**
   * A URL pathname segment.
   *
   * @example "/foo/$bar"
   */
  pathname: string;

  /**
   * A content rendered by a route.
   *
   * If `undefined` then router implicitly renders {@link Outlet}.
   */
  content?: RouteContent;

  /**
   * Validates and transforms params extracted from the {@link Location.pathname} and {@link Location.searchParams}.
   */
  paramsAdapter?: ParamsAdapter<Params> | ParamsAdapter<Params>['parse'];

  /**
   * Loads data that is synchronously available inside the {@link content}.
   *
   * @param params Route params extracted from a location.
   * @param context A context provided to a router.
   */
  dataLoader?: (params: Params, context: Context) => PromiseLike<Data> | Data;
  /**
   * A fallback that is rendered when the route content or data are being loaded.
   */
  pendingFallback?: ReactNode;

  /**
   * A fallback that is rendered when an error was thrown during route rendering.
   */
  errorFallback?: ReactNode;

  /**
   * A fallback that is rendered if there is no matched nested route.
   */
  notFoundFallback?: ReactNode;

  /**
   * What to render when route is being loaded.
   *
   * <dl>
   *   <dt>"fallback"</dt>
   *   <dd>A {@link pendingFallback} is always rendered if a route is matched and content or data are being loaded.</dd>
   *   <dt>"auto"</dt>
   *   <dd>If another route is currently rendered then it would be preserved until content and data of a newly matched
   *   route are loaded. Otherwise, a {@link pendingFallback} is rendered.</dd>
   * </dl>
   *
   * @default "auto"
   */
  pendingBehavior?: 'fallback' | 'auto';
}

export interface NavigateOptions {
  /**
   * An action that was requested to navigate to a location.
   *
   * <dl>
   *   <dt>"push"</dt>
   *   <dd>A location must be pushed to a history stack.</dd>
   *   <dt>"replace"</dt>
   *   <dd>A location must replace the current history entry.</dd>
   *   <dt>"redirect"</dt>
   *   <dd>A location must be used to redirect a client. Usually, redirects are triggered when {@link redirect} is
   *   called during route rendering or data loading.</dd>
   * </dl>
   */
  action: 'push' | 'replace' | 'redirect' | 'permanentRedirect';
}

export interface NavigateToRouteOptions extends Partial<NavigateOptions>, LocationOptions {}
