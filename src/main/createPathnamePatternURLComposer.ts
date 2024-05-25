import type { RawParams, URLComposer } from './types';

/**
 * Creates a composer that builds a URL by injecting params into a pathname pattern, and serializing the rest of params
 * as a search string.
 *
 * @param pathnamePattern The pathname pattern to build URL upon.
 */
export function createPathnamePatternURLComposer(pathnamePattern: string): URLComposer<any> {
  return (base, params, fragment, searchParamsParser) => {
    let pathname = pathnamePattern;

    const searchParams: RawParams = {};

    if (params !== undefined) {
      for (const key in params) {
        const value = params[key];

        if (value === null || value === undefined) {
          continue;
        }
        if (pathname === (pathname = pathname.replace(':' + key, String(value)))) {
          searchParams[key] = value;
        }
      }
    }

    let url = base + pathname;

    const search = searchParamsParser.stringify(searchParams);

    if (search !== '?' && search !== '') {
      url += search.charAt(0) === '?' ? search : '?' + search;
    }
    if (fragment !== undefined && fragment !== '#' && fragment !== '') {
      url += fragment.charAt(0) === '#' ? fragment : '#' + fragment;
    }

    return url;
  };
}
