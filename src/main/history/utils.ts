import { Location } from '../__types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';

/**
 * Composes a URL from a location.
 *
 * @param location A location to compose a URL from.
 * @param searchParamsAdapter An adapter that creates a search string.
 * @param base A base URL.
 */
export function toURL(location: Location, searchParamsAdapter = urlSearchParamsAdapter, base?: string | URL): string {
  const { pathname, searchParams, hash } = location;

  const search = searchParamsAdapter.stringify(searchParams);

  const url =
    pathname +
    (search === '' || search === '?' ? '' : search.charAt(0) === '?' ? search : '?' + search) +
    (hash === '' ? '' : '#' + encodeURIComponent(hash));

  return base === undefined ? url : new URL(url, base).toString();
}

/**
 * Parses a URL string as a location.
 *
 * @param url A URL to parse.
 * @param searchParamsAdapter An adapter that parses a search string.
 * @param base A base URL.
 */
export function parseURL(url: string, searchParamsAdapter = urlSearchParamsAdapter, base?: string | URL): Location {
  const { pathname, search, hash } = new URL(url, 'https://0');

  let basePathname;

  if (base !== undefined) {
    base = typeof base === 'string' ? new URL(base) : base;
    basePathname = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
  }

  return {
    pathname:
      basePathname !== undefined && pathname.startsWith(basePathname)
        ? pathname.substring(basePathname.length)
        : pathname,
    searchParams: searchParamsAdapter.parse(search),
    hash: decodeURIComponent(hash.substring(1)),
    state: undefined,
  };
}
