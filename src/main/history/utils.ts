import { Location, To } from '../types';
import { toLocation } from '../utils';
import { SearchParamsAdapter } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';

/**
 * Parses a pathname-search-hash string as a location.
 *
 * @param to A pathname-search-hash string to parse.
 * @param searchParamsAdapter An adapter that parses a search string.
 * @group History
 */
export function parseLocation(to: string, searchParamsAdapter = urlSearchParamsAdapter): Location {
  const hashIndex = to.indexOf('#');

  let searchIndex = to.indexOf('?');
  if (hashIndex !== -1 && searchIndex > hashIndex) {
    searchIndex = -1;
  }

  let pathname =
    searchIndex === -1 && hashIndex === -1 ? to : to.substring(0, searchIndex === -1 ? hashIndex : searchIndex);

  return {
    pathname: pathname === '' || pathname.charCodeAt(0) !== 47 ? '/' + pathname : pathname,
    searchParams: searchParamsAdapter.parse(
      searchIndex === -1 ? '' : to.substring(searchIndex + 1, hashIndex === -1 ? undefined : hashIndex)
    ),
    hash: hashIndex === -1 ? '' : decodeURIComponent(to.substring(hashIndex + 1)),
    state: undefined,
  };
}

/**
 * Stringifies a location as pathname-search-hash string.
 *
 * @param to A location to stringify.
 * @param searchParamsAdapter An adapter that stringifies a search string.
 * @group History
 */
export function stringifyLocation(to: To, searchParamsAdapter = urlSearchParamsAdapter): string {
  const { pathname, searchParams, hash } = toLocation(to);

  const search = searchParamsAdapter.stringify(searchParams);

  return (
    pathname +
    (search === '' || search === '?' ? '' : search.charCodeAt(0) === 63 ? search : '?' + search) +
    (hash === '' ? '' : '#' + encodeURIComponent(hash))
  );
}

/**
 * Prepends a base pathname to a pathname.
 */
export function rebasePathname(basePathname: string | undefined, pathname: string): string {
  if (basePathname === undefined || basePathname === '') {
    return pathname;
  }
  return (
    (basePathname.endsWith('/') ? basePathname.slice(0, -1) : basePathname) +
    (pathname.charCodeAt(0) === 47 ? pathname : '/' + pathname)
  );
}

/**
 * Removes a base pathname from a pathname, or throws an error if a pathname doesn't start with a base pathname.
 */
export function debasePathname(basePathname: string | undefined, pathname: string): string {
  if (basePathname === undefined || basePathname === '') {
    return pathname;
  }
  if (pathname === basePathname) {
    return '/';
  }

  let charCode;

  if (
    pathname.length > basePathname.length &&
    pathname.startsWith(basePathname) &&
    (basePathname.endsWith('/') ||
      (charCode = pathname.charCodeAt(basePathname.length)) === 47 ||
      charCode === 63 ||
      charCode === 35)
  ) {
    pathname = pathname.substring(basePathname.length);

    return pathname === '' || pathname.charCodeAt(0) !== 47 ? '/' + pathname : pathname;
  }

  throw new Error("Pathname doesn't match base pathname: " + basePathname);
}

export function parseOrCastLocation(to: To | string, searchParamsAdapter: SearchParamsAdapter): Location {
  return typeof to === 'string' ? parseLocation(to, searchParamsAdapter) : toLocation(to);
}
