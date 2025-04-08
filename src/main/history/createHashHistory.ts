import { PubSub } from 'parallel-universe';
import { Location } from '../types';
import { History, HistoryBlocker, HistoryOptions } from './types';
import { concatPathname, navigateOrBlock, parseLocation, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';
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
 * Creates the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 * @group History
 */
export function createHashHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  const blockers = new Set<HistoryBlocker>();
  const pubSub = new PubSub();

  const getHistoryEntry = (): HistoryEntry => {
    const location = parseLocation(decodeURIComponent(window.location.hash.substring(1)), searchParamsSerializer);
    const historyState: HistoryState = window.history.state;

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
      // Navigation rollback
      return;
    }

    if (blockers.size === 0) {
      entry = nextEntry;
      pubSub.publish();
      return;
    }

    // Navigation rollback
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

    const historyState: HistoryState = { index: entry.index, state: entry.location.state };
    const url = '#' + encodeHash(stringifyLocation(entry.location, searchParamsSerializer));

    window.history.replaceState(historyState, '', url);
  }

  return {
    get url() {
      return this.toURL(this.location);
    },

    get location() {
      return entry.location;
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsSerializer);
    },

    toAbsoluteURL(to) {
      return concatPathname(
        basePathname,
        '#' + encodeHash(typeof to === 'string' ? to : stringifyLocation(to, searchParamsSerializer))
      );
    },

    push(to) {
      abort();
      abort = navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        const historyState: HistoryState = { index: entry.index + 1, state: location.state };
        const url = '#' + encodeHash(stringifyLocation(location, searchParamsSerializer));

        window.history.pushState(historyState, '', url);

        entry = getHistoryEntry();
        pubSub.publish();
      });
    },

    replace(to) {
      abort();
      abort = navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        const historyState: HistoryState = { index: entry.index, state: location.state };
        const url = '#' + encodeHash(stringifyLocation(location, searchParamsSerializer));

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

function encodeHash(str: string): string {
  return str.replace(/[^-?/:@._~!$&'()*+,;=\w]/g, encodeURIComponent);
}
