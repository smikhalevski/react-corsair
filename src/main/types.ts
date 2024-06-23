import { ComponentType } from 'react';

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
 * The result of successful pathname matching.
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
 * @returns The matched pathname, or `undefined` if the pathname isn't supported.
 */
export type PathnameMatcher = (pathname: string) => PathnameMatch | null;

/**
 * Validates raw params that were extracted from a URL pathname and a search string by {@link PathnameMatcher} and
 * {@link SearchParamsParser}.
 *
 * @param rawParams Params extracted from a URL pathname and query.
 * @returns Validated and transformed params that are safe to use inside the app.
 * @template Params The validated params.
 */
export type ParamsParser<Params> = ((rawParams: RawParams) => Params) | { parse(rawParams: RawParams): Params };

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
   * Loads the data associated with the route.
   */
  dataLoader?: (params: Params) => Promise<void> | void;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   *
   * Here you can coerce, validate and rename params.
   */
  paramsParser?: ParamsParser<Params>;

  /**
   * Composes the URL of this route.
   */
  urlComposer?: URLComposer<Params>;

  /**
   * Applicable only if {@link pathname} is a string.
   *
   * If `true` then pathname leading and trailing slashes must strictly match the pathname pattern.
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
   * Loads the component rendered by the route.
   */
  componentLoader: ComponentLoader;

  /**
   * Loads the data associated with the route.
   */
  dataLoader: ((params: Params) => Promise<void> | void) | undefined;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  paramsParser: ParamsParser<Params> | undefined;

  /**
   * Composes the URL of the route.
   */
  urlComposer: URLComposer<Params>;
}
