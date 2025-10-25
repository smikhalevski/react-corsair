import { Location, Serializer, To } from '../types.js';
import { noop, toLocation } from '../utils.js';
import { HistoryBlocker, HistoryOptions, HistoryTransactionType } from './types.js';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';

/**
 * Serializes location as a URL string.
 */
export function createLocationSerializer(options: HistoryOptions = {}): Serializer<Location> {
  const { basePathname = '/', searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return {
    stringify: location => concatPathname(basePathname, stringifyLocation(location, searchParamsSerializer)),

    parse: url => parseLocation(debasePathname(basePathname, url), searchParamsSerializer),
  };
}

/**
 * Serializes location as a hash in a URL string.
 */
export function createHashLocationSerializer(options: HistoryOptions = {}): Serializer<Location> {
  const { basePathname = '', searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return {
    stringify(location) {
      const url = stringifyLocation(location, searchParamsSerializer);

      return url === '/' ? basePathname : concatPathname(basePathname, '#' + url);
    },

    parse(url) {
      url = debasePathname(basePathname, url);

      const hashIndex = url.indexOf('#');

      return parseLocation(hashIndex === -1 ? '' : url.substring(hashIndex + 1), searchParamsSerializer);
    },
  };
}

/**
 * Removes a base pathname from a pathname, or throws an error if a pathname doesn't start with a base pathname.
 */
export function debasePathname(basePathname: string, pathname: string): string {
  if (basePathname === '' || basePathname === '/') {
    return pathname;
  }
  if (pathname === basePathname) {
    return '';
  }

  if (basePathname.charCodeAt(basePathname.length - 1) === /* / */ 47) {
    basePathname = basePathname.slice(0, -1);

    if (pathname === basePathname) {
      return '';
    }
  }

  if (pathname.length > basePathname.length) {
    const charCode = pathname.charCodeAt(basePathname.length);

    if (
      pathname.startsWith(basePathname) &&
      (charCode === /* / */ 47 || charCode === /* ? */ 63 || charCode === /* # */ 35)
    ) {
      return pathname.substring(basePathname.length);
    }
  }

  throw new Error("Pathname doesn't match the required base: " + basePathname);
}

/**
 * Concatenates a base pathname and a pathname.
 */
export function concatPathname(basePathname: string, pathname: string): string {
  if (basePathname === '') {
    return pathname;
  }
  if (pathname === '' || pathname === '/') {
    return basePathname;
  }

  const charCode = pathname.charCodeAt(0);

  if (charCode === /* ? */ 63 || charCode === /* # */ 35) {
    return basePathname + pathname;
  }
  if (basePathname.charCodeAt(basePathname.length - 1) === /* / */ 47) {
    return (charCode === 47 ? basePathname.slice(0, -1) : basePathname) + pathname;
  }

  return basePathname + (charCode === 47 ? pathname : prependPathnameSeparator(pathname));
}

/**
 * Parses a pathname-search-hash string as a location.
 *
 * @param to A pathname-search-hash string to parse.
 * @param searchParamsSerializer An serializer that parses a search string.
 * @group History
 */
export function parseLocation(to: string, searchParamsSerializer: Serializer<Record<string, any>>): Location {
  const hashIndex = to.indexOf('#');

  let searchIndex = to.indexOf('?');
  if (hashIndex !== -1 && searchIndex > hashIndex) {
    searchIndex = -1;
  }

  return {
    pathname: prependPathnameSeparator(
      searchIndex === -1 && hashIndex === -1 ? to : to.substring(0, searchIndex === -1 ? hashIndex : searchIndex)
    ),
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
 * @param location A location to stringify.
 * @param searchParamsSerializer An serializer that stringifies a search string.
 * @group History
 */
export function stringifyLocation(location: Location, searchParamsSerializer: Serializer<Record<string, any>>): string {
  const { pathname, searchParams, hash } = location;

  const search = searchParamsSerializer.stringify(searchParams);

  return prependPathnameSeparator(
    pathname +
      (search === '' || search === '?' ? '' : search.charCodeAt(0) === 63 ? search : '?' + search) +
      (hash === '' ? '' : '#' + encodeURIComponent(hash))
  );
}

export function parseOrCastLocation(to: To | string, locationSerializer: Serializer<Location>): Location {
  return typeof to === 'string' ? locationSerializer.parse(to) : toLocation(to);
}

function prependPathnameSeparator(pathname: string): string {
  return pathname === '' ? '/' : pathname.charCodeAt(0) === 47 ? pathname : '/' + pathname;
}

/**
 * Returns `true` if page unload was blocked by any of blockers.
 */
export function isUnloadBlocked(blockers: Set<HistoryBlocker>, location: Location): boolean {
  if (blockers.size === 0) {
    return false;
  }

  let isCancelled = false;
  let isProceeded = false;

  const cancel = (): void => {
    isCancelled = true;
    isProceeded = false;
  };

  const proceed = (): void => {
    isCancelled = false;
    isProceeded = true;
  };

  for (const blocker of blockers) {
    if ((blocker({ type: 'unload', location, cancel, proceed }) !== false && !isProceeded) || isCancelled) {
      return true;
    }
  }

  return false;
}

/**
 * Calls {@link navigate} if {@link HistoryBlocker.proceed} was called for all {@link blockers} or all blockers
 * returned `false`.
 *
 * @param type The transaction type.
 * @param blockers A set of blockers that should grant permission to run an {@link navigate}.
 * @param location A location to which navigation is intended.
 * @param navigate A navigate callback.
 * @returns A callback that cancels navigation.
 */
export function navigateOrBlock(
  type: HistoryTransactionType,
  blockers: Set<HistoryBlocker>,
  location: Location,
  navigate: (location: Location) => void
): () => void {
  if (blockers.size === 0) {
    navigate(location);
    return noop;
  }

  const blockerQueue = Array.from(blockers);

  let nextBlockerIndex = 0;

  const cancel = (): void => {
    nextBlockerIndex = -1;
  };

  const nextBlocker = (): void => {
    if (nextBlockerIndex === -1) {
      // Aborted
      return;
    }

    if (nextBlockerIndex >= blockerQueue.length) {
      navigate(location);
      return;
    }

    const blockerIndex = nextBlockerIndex;
    const blocker = blockerQueue[blockerIndex];

    if (!blockers.has(blocker)) {
      // Blocker was removed
      nextBlockerIndex++;
      nextBlocker();
      return;
    }

    const proceed = (): void => {
      if (blockerIndex === nextBlockerIndex) {
        nextBlockerIndex++;
        nextBlocker();
      }
    };

    if (blocker({ type, location, proceed, cancel }) === false) {
      proceed();
    }
  };

  nextBlocker();

  return cancel;
}
