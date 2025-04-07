import { PubSub } from 'parallel-universe';
import { Location, To } from '../types';
import { History, HistoryBlocker, HistoryOptions, HistoryTransaction } from './types';
import { concatPathname, debasePathname, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';

/**
 * Creates the history adapter that reads and writes location to an in-memory stack.
 *
 * @param initialEntries A non-empty array of initial history entries.
 * @param options History options.
 * @group History
 */
export function createMemoryHistory(initialEntries: Array<To | string>, options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;
  const pubSub = new PubSub();
  const entries = initialEntries.map(entry =>
    parseOrCastLocation(typeof entry === 'string' ? debasePathname(basePathname, entry) : entry, searchParamsSerializer)
  );

  const blockers = new Set<HistoryBlocker>();

  if (entries.length === 0) {
    throw new Error('Expected at least one initial entry');
  }

  let cursor = entries.length - 1;

  return {
    get url() {
      return this.toURL(this.location);
    },

    get location() {
      return entries[cursor];
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsSerializer);
    },

    toAbsoluteURL(to) {
      return concatPathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsSerializer));
    },

    push(to) {
      navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        entries.splice(++cursor, entries.length, location);
        pubSub.publish();
      });
    },

    replace(to) {
      navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        entries.splice(cursor, entries.length, location);
        pubSub.publish();
      });
    },

    back() {
      if (cursor === 0) {
        return;
      }
      navigateOrBlock(blockers, entries[cursor - 1], _location => {
        if (cursor === 0) {
          return;
        }
        cursor--;
        pubSub.publish();
      });
    },

    subscribe(listener) {
      return pubSub.subscribe(listener);
    },

    registerBlocker(blocker) {
      blockers.add(blocker);

      return () => {
        blockers.delete(blocker);
      };
    },
  };
}

/**
 * Returns `true` if navigation was blocked.
 */
export function navigateOrBlock(
  blockers: Set<HistoryBlocker>,
  location: Location,
  setLocation: (location: Location, isPostponed: boolean) => void
): boolean {
  if (blockers.size === 0) {
    setLocation(location, false);
    return false;
  }

  let isPostponed = false;
  let hasProceeded = false;

  const transaction: HistoryTransaction = {
    location,
    proceed() {
      if (hasProceeded) {
        return;
      }
      hasProceeded = true;
      setLocation(location, isPostponed);
    },
  };

  for (const blocker of blockers) {
    if (blocker(transaction) || hasProceeded) {
      isPostponed = true;
      return !hasProceeded;
    }
  }

  setLocation(location, false);
  return false;
}
