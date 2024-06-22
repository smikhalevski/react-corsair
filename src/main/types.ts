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
export type PathnameMatcher = (pathname: string) => PathnameMatch | undefined;

/**
 * Validates raw params that were extracted from a URL pathname and a search string by {@link PathnameMatcher} and
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
 * @returns The resolution result, or `undefined` if the resolver cannot produce a result for given params.
 * @template Result The resolution result.
 * @template Params The validated params.
 */
export type Resolver<Result, Params> = (params: Params) => PromiseLike<Result | undefined> | Result | undefined;

/**
 * Composes an absolute URL with the given params and the fragment.
 *
 * @param baseURL The absolute base URL.
 * @param params The validated params.
 * @param fragment The [URL fragment](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).
 * @param searchParamsParser The search params parser that can produce a search string.
 * @template Params The validated params.
 */
export type URLComposer<Params> = (
  baseURL: string,
  params: Params,
  fragment: string | undefined,
  searchParamsParser: SearchParamsParser
) => string;

/**
 * Options of a route.
 *
 * @template Result The resolution result.
 * @template Params The validated params.
 */
export interface RouteOptions<Result, Params> {
  /**
   * The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   */
  pathname: string | PathnameMatcher;

  /**
   * The value that the route resolves with, or the callback that returns the result.
   *
   * In most cases, resolver should return a component, or a promise that is fulfilled with a component.
   */
  resolver: Result | Resolver<Result, Params>;

  /**
   * The search params parser.
   *
   * If omitted then the parser provided to the {@link RouterOptions.searchParamsParser router} is used.
   *
   * @see {@link paramsValidator}
   */
  searchParamsParser?: SearchParamsParser;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   *
   * Here you can coerce, validate and rename params.
   */
  paramsValidator?: ParamsValidator<Params>;

  /**
   * Applicable only if {@link pathname} is a string.
   *
   * If `true` then pathname leading and trailing slashes must strictly match the pathname pattern.
   *
   * @default false
   */
  slashSensitive?: boolean;

  /**
   * If `true` then the first result returned from the {@link resolver} is cached forever. Otherwise, resolver is
   * invoked every time a navigation occurs. If {@link resolver} isn't a function then it is always
   * {@link Route.isCacheable} cacheable.
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
   * Returns the result associated with the route.
   */
  readonly resolver: Resolver<Result, Params>;

  /**
   * Extracts raw params from the URL pathname.
   */
  readonly pathnameMatcher: PathnameMatcher;

  /**
   * The custom search params parser.
   */
  readonly searchParamsParser: SearchParamsParser | undefined;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  readonly paramsValidator: ParamsValidator<Params> | undefined;

  /**
   * Composes the URL of the route.
   */
  readonly urlComposer: URLComposer<Params>;

  /**
   * `true` if the result returned from the {@link resolver} is cached.
   *
   * @see {@link RouteOptions.cacheable}
   */
  readonly isCacheable: boolean;
}
