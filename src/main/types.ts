import { Router } from './Router';

/**
 * Raw params extracted from a URL.
 */
export interface RawParams {
  [name: string]: unknown;
}

/**
 * Extracts raw params from the URL pathname only.
 *
 * @param pathname The URL pathname to extract pathname params from.
 * @returns The extracted params, or `undefined` if the params cannot be extracted (pathname isn't supported).
 */
export type PathnameParamsParser = (pathname: string) => RawParams | undefined;

/**
 * Parses URL search string as raw params and stringifies to back.
 */
export interface SearchParamsParser {
  /**
   * Parse the URL search string as params.
   *
   * @param search The URL search string.
   * @returns Parsed params, `undefined` if params cannot be parsed.
   */
  parse(search: string): RawParams | undefined;

  /**
   * Stringifies params as a search string.
   *
   * @param rawParams Params to stringify.
   * @returns The URL search string.
   */
  stringify(rawParams: RawParams): string;
}

/**
 * Validates raw params that were extracted from a URL pathname and query by {@link PathnameParamsParser} and
 * {@link SearchParamsParser}.
 *
 * @param rawParams Params extracted from a URL pathname and query.
 * @returns Validated and transformed params that are safe to use inside the app.
 * @template Params The validated params.
 */
export type ParamsValidator<Params> = (rawParams: RawParams) => Params | undefined;

/**
 * Returns the result associated with a route.
 *
 * @param params The validated params.
 * @returns The resolution result.
 * @template Result The resolution result.
 * @template Params The validated params.
 */
export type Resolver<Result, Params> = (params: Params) => Promise<Result | undefined> | Result | undefined;

/**
 * Takes validated params and composes an absolute URL.
 *
 * @param baseURL The base URL.
 * @param params The validated params.
 * @param searchParamsParser The search params parser that can stringify the params.
 */
export type URLComposer<Params> = (
  baseURL: string,
  params: Params,
  fragment: string | undefined,
  searchParamsParser: SearchParamsParser
) => string;

export interface RouteOptions<Result, Params> {
  /**
   * The route pathname pattern that uses {@link URLPattern} syntax, or a callback that parses a pathname into a param
   * mapping.
   */
  pathname: string | PathnameParamsParser;

  /**
   * The search params parser. If omitted then the parser provided to the router is used.
   */
  searchParamsParser?: SearchParamsParser;

  /**
   * Parses params that were extracted from the URL pathname and query. Here you can coerce, validate and rename params.
   *
   * **Note:** If omitted then params for this route won't be available through the router.
   */
  paramsValidator?: ParamsValidator<Params>;

  /**
   * Returns the result associated with the route.
   */
  resolver: Resolver<Result, Params>;

  /**
   * If `true` then the first result returned from the {@link resolver} is cached forever.
   *
   * @default false
   */
  cacheable?: boolean;

  /**
   * Composes the URL of this route.
   */
  urlComposer?: URLComposer<Params>;
}

/**
 * The route that maps pathname and params to a resolved result.
 *
 * @template Params The validated params.
 * @template Result The resolution result.
 */
export interface Route<Result, Params> {
  /**
   * Extracts raw params from the URL pathname only.
   */
  readonly pathnameParamsParser: PathnameParamsParser;

  /**
   * The search params parser. If omitted then the parser provided to the router is used.
   */
  readonly searchParamsParser: SearchParamsParser | undefined;

  /**
   * Returns the result associated with the route.
   */
  readonly resolver: Resolver<Result, Params>;

  /**
   * Composes the URL of the route.
   */
  readonly urlComposer: URLComposer<Params>;

  /**
   * Parses params that were extracted from the URL pathname and query.
   */
  readonly paramsValidator: ParamsValidator<Params> | undefined;
}

/**
 * The event published by the {@link Router} instance.
 */
export interface RouterEvent<Result = any> {
  /**
   * The type of the event.
   */
  type: 'pending' | 'navigated' | 'notFound';

  /**
   * The router that published the event.
   */
  target: Router<Result>;
}
