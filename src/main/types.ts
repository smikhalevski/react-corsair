import { ComponentType, ReactElement } from 'react';

/**
 * Raw params extracted from a URL.
 */
export interface RawParams {
  [name: string]: any;
}

/**
 * Extracts raw params from a URL search string and stringifies them back.
 */
export interface SearchParamsParser {
  /**
   * Extract raw params from a URL search string.
   *
   * @param search The URL search string to extract params from.
   * @returns Parsed params, or `undefined` if params cannot be parsed.
   */
  parse(search: string): RawParams;

  /**
   * Stringifies params as a search string.
   *
   * @param rawParams Params to stringify.
   * @returns The URL search string.
   */
  stringify(rawParams: RawParams): string;
}

/**
 * The result of a successful pathname matching.
 */
export interface PathnameMatch {
  /**
   * The part of the pathname that was matched.
   */
  pathname: string;

  /**
   * Params that were extracted from the pathname.
   */
  params: RawParams;
}

/**
 * Extracts raw params from the URL pathname.
 *
 * @param pathname The URL pathname to extract params from.
 * @returns The matched pathname, or `null` if the pathname isn't supported.
 */
export type PathnameMatcher = (pathname: string) => PathnameMatch | null;

/**
 * Parses raw params that were extracted from a URL pathname and search string by {@link PathnameMatcher} and
 * {@link SearchParamsParser}.
 *
 * @template Params The validated params.
 */
export interface ParamsParser<Params> {
  /**
   * Parses raw params as validated params.
   *
   * **Note:** If provided raw params cannot be parsed, parser should throw an error.
   *
   * @param rawParams Params extracted from a URL pathname and query.
   * @returns Validated and transformed params that are safe to use inside the app.
   */
  parse(rawParams: RawParams): Params;
}

/**
 * Composes an absolute URL with the given params and the fragment.
 *
 * @param base The absolute base URL or pathname.
 * @param params The validated params.
 * @param fragment The [URL fragment](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).
 * @param searchParamsParser The search params parser that can produce a search string.
 * @template Params The validated params.
 */
export type URLComposer<Params> = (
  base: string,
  params: Params,
  fragment: string | undefined,
  searchParamsParser: SearchParamsParser
) => string;

/**
 * Returns the component or a module with a default export.
 */
export type ComponentLoader = () => PromiseLike<{ default: ComponentType }> | ComponentType;

/**
 * Options of a route.
 *
 * @template Params The validated params.
 */
export interface RouteOptions<Params> {
  /**
   * The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   */
  pathname: string | PathnameMatcher;

  /**
   * Loads the component rendered by the route.
   */
  componentLoader: ComponentLoader;

  /**
   * Loads the data required during the route rendering.
   */
  dataLoader?: (params: Params) => PromiseLike<void> | void;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  paramsParser?: ParamsParser<Params> | ParamsParser<Params>['parse'];

  /**
   * Composes the URL of the route.
   */
  urlComposer?: URLComposer<Params>;

  /**
   * If `true` then pathname leading and trailing slashes must strictly match the pathname pattern.
   *
   * **Note:** Applicable only if {@link pathname} is a string.
   *
   * @default false
   */
  slashSensitive?: boolean;
}

/**
 * The route that maps pathname and params to a resolved result.
 *
 * @template Params The validated params.
 */
export interface Route<Params> {
  /**
   * Extracts raw params from the URL pathname.
   */
  pathnameMatcher: PathnameMatcher;

  /**
   * Loads the component and required data and resolves with the element that must be rendered.
   */
  renderer: (params: Params) => Promise<ReactElement> | ReactElement;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  paramsParser: ParamsParser<Params> | undefined;

  /**
   * Composes the URL of the route.
   */
  urlComposer: URLComposer<Params>;
}
