import { Location, To } from '../types';
import { noop, toLocation } from '../utils';
import { HistoryBlocker, SearchParamsSerializer } from './types';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';

/**
 * Parses a pathname-search-hash string as a location.
 *
 * @param to A pathname-search-hash string to parse.
 * @param searchParamsSerializer An adapter that parses a search string.
 * @group History
 */
export function parseLocation(to: string, searchParamsSerializer = jsonSearchParamsSerializer): Location {
  const hashIndex = to.indexOf('#');

  let searchIndex = to.indexOf('?');
  if (hashIndex !== -1 && searchIndex > hashIndex) {
    searchIndex = -1;
  }

  let pathname =
    searchIndex === -1 && hashIndex === -1 ? to : to.substring(0, searchIndex === -1 ? hashIndex : searchIndex);

  return {
    pathname: pathname === '' || pathname.charCodeAt(0) !== 47 ? '/' + pathname : pathname,
    searchParams: searchParamsSerializer.parse(
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
 * @param searchParamsSerializer An adapter that stringifies a search string.
 * @group History
 */
export function stringifyLocation(to: To, searchParamsSerializer = jsonSearchParamsSerializer): string {
  const { pathname, searchParams, hash } = toLocation(to);

  const search = searchParamsSerializer.stringify(searchParams);

  return (
    pathname +
    (search === '' || search === '?' ? '' : search.charCodeAt(0) === 63 ? search : '?' + search) +
    (hash === '' ? '' : '#' + encodeURIComponent(hash))
  );
}

/**
 * Concatenates a base pathname and a pathname.
 */
export function concatPathname(basePathname: string | undefined, pathname: string): string {
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

/**
 * Parses {@link to} as a location.
 *
 * @returns A new location.
 */
export function parseOrCastLocation(to: To | string, searchParamsSerializer: SearchParamsSerializer): Location {
  return typeof to === 'string' ? parseLocation(to, searchParamsSerializer) : toLocation(to);
}

/**
 * Calls {@link navigate} if proceed was called for all {@link blockers} or all blockers returned `false`.
 *
 * @param blockers A set of blockers that should grant permission to run an {@link navigate}.
 * @param location A location to pass to {@link blockers}.
 * @param navigate A navigate callback.
 * @returns A callback that aborts navigation.
 */
export function navigateOrBlock(
  blockers: Set<HistoryBlocker>,
  location: Location,
  navigate: (location: Location) => void
): () => void {
  if (blockers.size === 0) {
    navigate(location);
    return noop;
  }

  const blockerQueue = Array.from(blockers);

  let cursor = 0;

  const nextBlocker = () => {
    if (cursor === -1) {
      // Aborted
      return;
    }

    if (cursor >= blockerQueue.length) {
      navigate(location);
      return;
    }

    const blockerIndex = cursor;
    const blocker = blockerQueue[blockerIndex];

    if (!blockers.has(blocker)) {
      // Blocker was removed
      cursor++;
      nextBlocker();
      return;
    }

    const proceed = () => {
      if (blockerIndex === cursor) {
        cursor++;
        nextBlocker();
      }
    };

    if (!blocker({ location, proceed })) {
      proceed();
    }
  };

  nextBlocker();

  return () => {
    cursor = -1;
  };
}
