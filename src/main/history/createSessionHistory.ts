import { PubSub } from 'parallel-universe';
import { History, HistoryBlocker, SearchParamsSerializer } from './types';
import { isUnloadBlocked, navigateOrBlock, parseLocation, parseOrCastLocation, stringifyLocation } from './utils';
import { Location } from '../types';
import { noop } from '../utils';

interface HistoryRecord {
  index: number;
  location: Location;
}

/**
 * The state that is stored in `window.history.state`.
 */
interface HistoryState {
  index: number;
  state: unknown;
}

/**
 * Creates the DOM history adapter that reads and writes location to a browser's session history.
 *
 * @param getURL Returns the current history-local URL.
 * @param toAbsoluteURL Converts the history-local URL to absolute URL.
 * @param searchParamsSerializer Serializes/parses a URL search string.
 */
export function createSessionHistory(
  getURL: () => string,
  toAbsoluteURL: (url: string) => string,
  searchParamsSerializer: SearchParamsSerializer
): History {
  const pubSub = new PubSub();
  const blockers = new Set<HistoryBlocker>();

  /**
   * Reads the record that reflects the current session history state.
   */
  const getHistoryRecord = (): HistoryRecord => {
    const location = parseLocation(getURL(), searchParamsSerializer);
    const historyState: HistoryState | null = window.history.state;

    if (historyState === null) {
      return { index: -1, location };
    }

    location.state = historyState.state;

    return { index: historyState.index, location };
  };

  const handlePopstate = (): void => {
    const nextRecord = getHistoryRecord();
    const delta = nextRecord.index - record.index;

    if (delta === 0) {
      applyPopstate();
      return;
    }

    if (blockers.size === 0) {
      record = nextRecord;
      pubSub.publish();
      return;
    }

    // Check the transaction is blocked after the popstate is reverted
    applyPopstate = () => {
      applyPopstate = noop;

      cancel();

      cancel = navigateOrBlock('pop', blockers, nextRecord.location, () => {
        record = nextRecord;

        window.history.go(delta);

        applyPopstate = () => {
          applyPopstate = noop;
          pubSub.publish();
        };
      });
    };

    // Revert the popstate
    window.history.go(-delta);
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (isUnloadBlocked(blockers, record.location)) {
      event.preventDefault();
    }
  };

  let applyPopstate = noop;
  let cancel = noop;
  let record = getHistoryRecord();

  if (record.index === -1) {
    record.index = 0;

    // Ensure the history state is ordinal
    window.history.replaceState({ index: 0, state: record.location.state } as HistoryState, '');
  }

  return {
    get url() {
      return this.toURL(record.location);
    },

    get location() {
      return record.location;
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsSerializer);
    },

    toAbsoluteURL(to) {
      return toAbsoluteURL(typeof to === 'string' ? to : stringifyLocation(to, searchParamsSerializer));
    },

    push(to) {
      cancel();

      cancel = navigateOrBlock('push', blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        const url = toAbsoluteURL(stringifyLocation(location, searchParamsSerializer));

        window.history.pushState({ index: record.index + 1, state: location.state } as HistoryState, '', url);

        applyPopstate = noop;
        record = getHistoryRecord();
        pubSub.publish();
      });
    },

    replace(to) {
      cancel();

      cancel = navigateOrBlock('replace', blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        const url = toAbsoluteURL(stringifyLocation(location, searchParamsSerializer));

        window.history.replaceState({ index: record.index, state: location.state } as HistoryState, '', url);

        applyPopstate = noop;
        record = getHistoryRecord();
        pubSub.publish();
      });
    },

    back() {
      window.history.back();
    },

    forward() {
      window.history.forward();
    },

    go(delta) {
      window.history.go(delta);
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
      if (blockers.size === 0) {
        window.addEventListener('beforeunload', handleBeforeUnload);
      }

      blockers.add(blocker);

      return () => {
        blockers.delete(blocker);

        // Restore the salvageable page state
        // https://html.spec.whatwg.org/#unloading-documents
        if (blockers.size === 0) {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        }
      };
    },
  };
}
