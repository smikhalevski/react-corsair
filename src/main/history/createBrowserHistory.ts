import { PubSub } from 'parallel-universe';
import { History, HistoryBlocker, HistoryOptions } from './types';
import { concatPathname, debasePathname, parseLocation, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';
import { Location, To } from '../types';
import { navigateOrBlock } from './createMemoryHistory';

interface HistoryEntry {
  index: number;
  location: Location;
}

/**
 * Creates the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  const pubSub = new PubSub();
  const blockers = new Set<HistoryBlocker>();

  const getHistoryEntry = (): HistoryEntry => {
    const { pathname, search, hash } = window.location;
    const { state } = window.history;
    const location = parseLocation(debasePathname(basePathname, pathname + search + hash), searchParamsSerializer);

    if (state === null) {
      return { index: -1, location };
    }

    location.state = state.state;

    return { index: state.index, location };
  };

  let entry = getHistoryEntry();

  if (entry.index === -1) {
    entry.index = 0;

    window.history.replaceState(
      { index: 0, state: entry.location.state },
      '',
      concatPathname(basePathname, stringifyLocation(entry.location, searchParamsSerializer))
    );
  }

  const handlePopstate = (_event: PopStateEvent) => {
    const nextEntry = getHistoryEntry();

    const isBlocked = navigateOrBlock(blockers, nextEntry.location, (_location, isPostponed) => {
      if (isPostponed) {
        window.history.go(nextEntry.index - entry.index);
      }
      entry = nextEntry;
      pubSub.publish();
    });

    if (isBlocked) {
      // Rollback location
      window.history.go(entry.index - nextEntry.index);
    }
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {};

  return {
    get url() {
      return this.toURL(entry.location);
    },

    get location() {
      return entry.location;
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsSerializer);
    },

    toAbsoluteURL(to) {
      return concatPathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsSerializer));
    },

    push(to) {
      navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        window.history.pushState(
          { index: entry.index + 1, state: location.state },
          '',
          concatPathname(basePathname, stringifyLocation(location, searchParamsSerializer))
        );

        entry = getHistoryEntry();
        pubSub.publish();
      });
    },

    replace(to) {
      navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        window.history.replaceState(
          { index: entry.index, state: location.state },
          '',
          concatPathname(basePathname, stringifyLocation(location, searchParamsSerializer))
        );

        entry = getHistoryEntry();
        pubSub.publish();
      });
    },

    back() {
      window.history.back();
    },

    subscribe(listener) {
      if (pubSub.listenerCount === 0) {
        window.addEventListener('popstate', handlePopstate);
        window.addEventListener('beforeunload', handleBeforeUnload);
      }

      const unsubscribe = pubSub.subscribe(listener);

      return () => {
        unsubscribe();

        if (pubSub.listenerCount === 0) {
          window.removeEventListener('popstate', handlePopstate);
          window.removeEventListener('beforeunload', handleBeforeUnload);
        }
      };
    },

    registerBlocker(blocker) {
      blockers.add(blocker);

      return () => {
        blockers.delete(blocker);
      };
    },
  };
}
