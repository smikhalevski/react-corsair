import { PubSub } from 'parallel-universe';
import { History, HistoryBlocker, HistoryOptions } from './types';
import { concatPathname, debasePathname, parseLocation, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';
import { Location, To } from '../types';

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
  const blockers: HistoryBlocker[] = [];

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

  const setHistoryEntry = (to: To | string, isReplace: boolean): void => {
    const location = parseOrCastLocation(to, searchParamsSerializer);
    const url = concatPathname(basePathname, stringifyLocation(location, searchParamsSerializer));

    if (isReplace) {
      window.history.replaceState({ index: entry.index, state: location.state }, '', url);
    } else {
      window.history.pushState({ index: entry.index + 1, state: location.state }, '', url);
    }

    entry = getHistoryEntry();
  };

  let entry = getHistoryEntry();

  if (entry.index === -1) {
    entry.index = 0;
    setHistoryEntry(entry.location, true);
  }

  const handlePopstate = (event: PopStateEvent) => {
    entry = getHistoryEntry();
    pubSub.publish();
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {};

  return {
    get url() {
      return this.toURL(entry.location);
    },

    get index() {
      return entry.index;
    },

    get length() {
      return 0;
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
      setHistoryEntry(to, false);
      pubSub.publish();
    },

    replace(to) {
      setHistoryEntry(to, true);
      pubSub.publish();
    },

    back() {
      window.history.back();
      entry = getHistoryEntry();
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
      blockers.push(blocker);

      return () => {
        blockers.splice(blockers.indexOf(blocker), 1);
      };
    },
  };
}
