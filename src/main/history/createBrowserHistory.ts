import { PubSub } from 'parallel-universe';
import { History, HistoryBlocker, HistoryOptions } from './types';
import {
  concatPathname,
  debasePathname,
  navigateOrBlock,
  parseLocation,
  parseOrCastLocation,
  stringifyLocation,
} from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';
import { Location } from '../types';
import { noop } from '../utils';

interface HistoryEntry {
  index: number;
  location: Location;
}

interface HistoryState {
  index: number;
  state: unknown;
}

/**
 * Creates the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  const blockers = new Set<HistoryBlocker>();
  const pubSub = new PubSub();

  const getHistoryEntry = (): HistoryEntry => {
    const { pathname, search, hash } = window.location;
    const historyState: HistoryState = window.history.state;
    const location = parseLocation(debasePathname(basePathname, pathname) + search + hash, searchParamsSerializer);

    if (historyState === null) {
      return { index: -1, location };
    }

    location.state = historyState.state;

    return { index: historyState.index, location };
  };

  const handlePopstate = () => {
    const nextEntry = getHistoryEntry();
    const delta = entry.index - nextEntry.index;

    if (delta === 0) {
      return;
    }

    if (blockers.size === 0) {
      entry = nextEntry;
      pubSub.publish();
      return;
    }

    // Rollback navigation
    window.history.go(-delta);

    abort();

    abort = navigateOrBlock(blockers, nextEntry.location, () => {
      entry = nextEntry;
      window.history.go(delta);
      pubSub.publish();
    });
  };

  let abort = noop;
  let entry = getHistoryEntry();

  if (entry.index === -1) {
    entry.index = 0;

    const historyState: HistoryState = { index: 0, state: entry.location.state };
    const url = concatPathname(basePathname, stringifyLocation(entry.location, searchParamsSerializer));

    window.history.replaceState(historyState, '', url);
  }

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
      abort();

      abort = navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        const historyState: HistoryState = { index: entry.index + 1, state: location.state };
        const url = concatPathname(basePathname, stringifyLocation(location, searchParamsSerializer));

        window.history.pushState(historyState, '', url);

        entry = getHistoryEntry();
        pubSub.publish();
      });
    },

    replace(to) {
      abort();

      abort = navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        const historyState: HistoryState = { index: entry.index, state: location.state };
        const url = concatPathname(basePathname, stringifyLocation(location, searchParamsSerializer));

        window.history.replaceState(historyState, '', url);

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
      }

      const unsubscribe = pubSub.subscribe(listener);

      return () => {
        unsubscribe();

        if (pubSub.listenerCount === 0) {
          window.removeEventListener('popstate', handlePopstate);
        }
      };
    },

    block(blocker) {
      blockers.add(blocker);

      return () => {
        blockers.delete(blocker);
      };
    },
  };
}
