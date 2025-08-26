import { PubSub } from 'parallel-universe';
import { BrowserHistory, HistoryBlocker, SearchParamsSerializer } from './types.js';
import { isUnloadBlocked, navigateOrBlock, parseLocation, parseOrCastLocation, stringifyLocation } from './utils.js';
import { Location } from '../types.js';
import { noop } from '../utils.js';

interface SessionHistoryEntry {
  index: number;
  location: Location;
}

/**
 * The state that is stored in `window.history.state`.
 */
interface SessionHistoryState {
  index: number;
  state: unknown;
}

interface SessionHistoryOptions {
  /**
   * Serializes/parses a URL search string.
   */
  searchParamsSerializer: SearchParamsSerializer;

  /**
   * Returns the current history-local URL.
   */
  getURL(): string;

  /**
   * Converts the history-local URL to absolute URL.
   */
  toAbsoluteURL(url: string): string;
}

/**
 * Creates the DOM history adapter that reads and writes location to a browser's session history.
 */
export function createSessionHistory(options: SessionHistoryOptions): BrowserHistory {
  const { searchParamsSerializer, getURL, toAbsoluteURL } = options;

  const pubSub = new PubSub();
  const blockers = new Set<HistoryBlocker>();

  /**
   * Returns an entry that reflects the current state of the session history.
   */
  const getCurrentEntry = (): SessionHistoryEntry => {
    const location = parseLocation(getURL(), searchParamsSerializer);
    const historyState: SessionHistoryState | null = window.history.state;

    if (historyState === null) {
      return { index: -1, location };
    }

    location.state = historyState.state;

    return { index: historyState.index, location };
  };

  const handlePopstate = (): void => {
    const nextEntry = getCurrentEntry();
    const delta = nextEntry.index - entry.index;

    if (delta === 0) {
      applyPopstate();
      return;
    }

    if (blockers.size === 0) {
      entry = nextEntry;
      pubSub.publish();
      return;
    }

    // Check the transaction is blocked after the popstate is reverted
    applyPopstate = () => {
      applyPopstate = noop;

      cancel();

      cancel = navigateOrBlock('pop', blockers, nextEntry.location, () => {
        entry = nextEntry;

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
    if (isUnloadBlocked(blockers, entry.location)) {
      event.preventDefault();
    }
  };

  let applyPopstate = noop;
  let cancel = noop;
  let entry = getCurrentEntry();

  if (entry.index === -1) {
    // The current entry wasn't persisted to the session history yet
    entry.index = 0;

    window.history.replaceState({ index: 0, state: entry.location.state } satisfies SessionHistoryState, '');
  }

  return {
    get url() {
      return this.toURL(entry.location);
    },

    get location() {
      return entry.location;
    },

    get canGoBack() {
      return entry.index !== 0;
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
        window.history.pushState(
          { index: entry.index + 1, state: location.state } satisfies SessionHistoryState,
          '',
          toAbsoluteURL(stringifyLocation(location, searchParamsSerializer))
        );

        applyPopstate = noop;
        entry = getCurrentEntry();
        pubSub.publish();
      });
    },

    replace(to) {
      cancel();

      cancel = navigateOrBlock('replace', blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        window.history.replaceState(
          { index: entry.index, state: location.state } satisfies SessionHistoryState,
          '',
          toAbsoluteURL(stringifyLocation(location, searchParamsSerializer))
        );

        applyPopstate = noop;
        entry = getCurrentEntry();
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
      return pubSub.subscribe(listener);
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

    start() {
      window.addEventListener('popstate', handlePopstate);

      return () => window.removeEventListener('popstate', handlePopstate);
    },
  };
}
