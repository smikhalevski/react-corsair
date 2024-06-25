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
 * The result of a successful pathname matching.
 */
export interface PathnameMatch {
  /**
   * The index in the pathname up-to which it was matched.
   */
  index: number;

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
 * @template Params The parsed and validated URL params.
 */
export interface ParamsParser<Params> {
  /**
   * Parses and validates raw params.
   *
   * **Note:** If provided raw params cannot be parsed, parser should throw an error.
   *
   * @param rawParams Params extracted from a URL pathname and search string.
   * @returns Parsed and validated params that are safe to use inside the app.
   */
  parse(rawParams: RawParams): Params;
}

/**
 * Composes a URL with the given params and the fragment.
 *
 * @param base The absolute base URL or pathname.
 * @param params The parsed and validated URL params.
 * @param fragment The [URL fragment](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).
 * @param searchParamsParser The search params parser that can produce a search string.
 * @template Params The parsed and validated URL params.
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
export type ComponentFetcher = () => PromiseLike<{ default: ComponentType }> | ComponentType;

export interface NavigateOptions {
  fragment?: string;

  /**
   * The arbitrary navigation state, that can be passed to {@link !History.state}.
   */
  state?: any;

  /**
   * If `true` then navigation should replace the current history entry.
   *
   * @default false
   */
  replace?: boolean;
}
