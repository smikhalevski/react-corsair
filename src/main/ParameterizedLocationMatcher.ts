import { URLPattern } from 'urlpattern-polyfill';
import { Location, LocationMatch, LocationMatcher, LocationOptions } from './types';

/**
 * Raw params extracted from a URL.
 */
export interface RawParams {
  [name: string]: any;
}

/**
 * Parses raw params that were extracted from a URL pathname and search string by {@link PathnameParser} and
 * {@link SearchParamsParser}.
 *
 * @template Params Parsed URL params.
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

export interface ParameterizedLocationParserOptions<Params> {
  /**
   * The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   */
  pathname: string;

  /**
   * Parses params that were extracted from the pathname and search string.
   */
  paramsParser: ParamsParser<Params> | ParamsParser<Params>['parse'];

  searchParamsParser?: SearchParamsParser;

  /**
   * If `true` then pathname leading and trailing slashes must strictly match {@link pathname the pathname pattern}.
   *
   * **Note:** Applicable only if {@link pathname} is a string.
   *
   * @default false
   */
  isSlashSensitive?: boolean;
}

export class ParameterizedLocationMatcher<Params> implements LocationMatcher<Params, any> {
  private readonly _pathnameMatcher;
  private readonly _urlComposer;
  private readonly _paramsParser: ParamsParser<Params>;
  private readonly _searchParamsParser;

  constructor(options: ParameterizedLocationParserOptions<Params>) {
    this._pathnameMatcher = createPathnameMatcher(options.pathname, options.isSlashSensitive);
    this._urlComposer = createURLComposer(options.pathname);
    this._searchParamsParser = options.searchParamsParser || urlSearchParamsParser;
    this._paramsParser =
      typeof options.paramsParser === 'function' ? { parse: options.paramsParser } : options.paramsParser;
  }

  matchLocation(location: Location, _context: any): LocationMatch<Params> | null {
    const match = this._pathnameMatcher(location.pathname);

    if (match === null) {
      return null;
    }

    const params = this._paramsParser.parse({
      ...this._searchParamsParser.parse(location.search),
      ...match.pathnameParams,
    });

    return {
      pathname: match.pathname,
      successivePathname: match.successivePathname,
      params,
      hash: location.hash,
      state: location.state,
    };
  }

  createLocation(options: LocationOptions<Params>, _context: any): Location {
    return this._urlComposer(options, this._searchParamsParser);
  }
}

/**
 * Infers pathname matcher from URL pattern.
 *
 * @param pattern The pathname pattern with {@link !URLPattern} syntax that the created composer would use to build URLs
 * upon.
 * @param isSlashSensitive If `true` then pathname leading and trailing slashes must strictly match the pattern.
 */
export function createPathnameMatcher(
  pattern: string,
  isSlashSensitive = false
): (pathname: string) => {
  pathname: string;
  successivePathname: string | undefined;
  pathnameParams: RawParams;
} | null {
  const urlPattern = new URLPattern({ pathname: pattern });
  const hasSuccessivePathname = pattern === '*' || pattern.endsWith('/*');

  const a = pattern[0] === '/';
  const b = pattern[pattern.length - 1] === '/';

  return pathname => {
    if (!isSlashSensitive) {
      if (a !== (pathname.length !== 0 && pathname[0] === '/')) {
        pathname = a ? '/' + pathname : pathname.substring(1);
      }

      if (b !== (pathname.length !== 0 && pathname[pathname.length - 1] === '/')) {
        pathname = b ? pathname + '/' : pathname.slice(0, -1);
      }
    }

    const match = urlPattern.exec({ pathname });

    if (match === null) {
      return null;
    }

    const pathnameParams = match.pathname.groups;

    let successivePathname;

    if (hasSuccessivePathname) {
      for (let i = 0; pathnameParams[i] !== undefined; ++i) {
        successivePathname = pathnameParams[i];
      }
      pathname = pathname.substring(0, pathname.length - successivePathname!.length - 1);
    }

    return { pathname, pathnameParams, successivePathname };
  };
}

/**
 * Creates a composer that builds a URL by injecting params into a pathname pattern, and serializing the rest of params
 * as a search string.
 *
 * @param pattern The pathname pattern with {@link !URLPattern} syntax that the created composer would use to build URLs
 * upon.
 */
export function createURLComposer(
  pattern: string
): (options: LocationOptions<any>, searchParamsParser: SearchParamsParser) => Location {
  if (!/^[^*{(]*\**$/.test(pattern)) {
    throw new Error(
      'Cannot infer pathComposer from a pathname that contains non-capturing groups, RegExp groups, or non-trailing wildcards. The pathComposer option is required.'
    );
  }

  pattern = pattern.replace(/\/?\*+$/, '');

  return (options, searchParamsParser) => {
    let pathname = pattern;
    let search = '';

    if (options.params !== undefined) {
      const searchParams: RawParams = {};

      for (const name of Object.keys(options.params).sort(compareLengthDescending)) {
        const value = options.params[name];

        if (value === null || value === undefined) {
          continue;
        }
        if (pathname === (pathname = pathname.replace(':' + name, encodeURIComponent(value)))) {
          searchParams[name] = value;
        }
      }

      if (pathname.indexOf(':') !== -1) {
        throw new Error('Pathname params are missing: ' + /:[\w$]+/g.exec(pathname));
      }

      search = searchParamsParser.stringify(searchParams);
    }

    search = search.length === 0 || search === '?' ? '' : search[0] === '?' ? search : '?' + search;

    let hash = options.hash;

    hash =
      hash === undefined || hash.length === 0 || hash === '#'
        ? ''
        : hash[0] === '#'
          ? hash
          : '#' + encodeURIComponent(hash);

    return { pathname, search, hash, state: options.state };
  };
}

function compareLengthDescending(a: string, b: string): number {
  return b.length - a.length;
}

/**
 * Parses URL search params using {@link !URLSearchParams}.
 */
export const urlSearchParamsParser: SearchParamsParser = {
  parse(search) {
    const urlSearchParams = new URLSearchParams(search);
    const rawParams: RawParams = {};

    for (const key of urlSearchParams.keys()) {
      const value = urlSearchParams.getAll(key);

      rawParams[key] = value.length === 1 ? value[0] : value;
    }
    return rawParams;
  },

  stringify(rawParams) {
    const urlSearchParams = new URLSearchParams();

    for (const key in rawParams) {
      const value = rawParams[key];

      if (value !== null && typeof value === 'object' && Symbol.iterator in value) {
        for (const item of Array.isArray(value) ? value : Array.from(value)) {
          urlSearchParams.append(key, String(item));
        }
      } else {
        urlSearchParams.set(key, String(value));
      }
    }
    return urlSearchParams.toString();
  },
};
