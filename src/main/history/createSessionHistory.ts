import { PubSub } from 'parallel-universe';
import { BrowserHistory, HistoryBlocker } from './types.js';
import { isUnloadBlocked, navigateOrBlock, parseOrCastLocation } from './utils.js';
import { Location, Serializer } from '../types.js';
import { noop, toLocation } from '../utils.js';

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

/**
 * Creates the DOM history adapter that reads and writes location to a browser's session history.
 *
 * @param locationSerializer A serializer that parses URLs as locations and serializes locations as URLs. URLs don't
 * have an origin.
 */
export function createSessionHistory(locationSerializer: Serializer<Location>): BrowserHistory {
  // Returns an entry that reflects the current state of the session history
  const getActualEntry = (): SessionHistoryEntry => {
    const location = locationSerializer.parse(window.location.pathname + window.location.search + window.location.hash);
    const historyState: SessionHistoryState | null = window.history.state;

    if (historyState === null) {
      return { index: -1, location };
    }

    location.state = historyState.state;

    return { index: historyState.index, location };
  };

  const handlePopstate = (): void => {
    const nextEntry = getActualEntry();
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

      cancelNavigation();

      cancelNavigation = navigateOrBlock('pop', blockers, nextEntry.location, () => {
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

  const blockers = new Set<HistoryBlocker>();
  const pubSub = new PubSub();

  let applyPopstate = noop;
  let cancelNavigation = noop;
  let entry = getActualEntry();

  if (entry.index === -1) {
    // The current entry isn't persisted in the session history
    entry.index = 0;

    window.history.replaceState({ index: 0, state: entry.location.state } satisfies SessionHistoryState, '');
  }

  return {
    get url() {
      return locationSerializer.stringify(entry.location);
    },

    get location() {
      return entry.location;
    },

    get canGoBack() {
      return entry.index !== 0;
    },

    toURL(to) {
      return locationSerializer.stringify(toLocation(to));
    },

    parseURL(url) {
      return locationSerializer.parse(url);
    },

    push(to) {
      cancelNavigation();

      cancelNavigation = navigateOrBlock('push', blockers, parseOrCastLocation(to, locationSerializer), location => {
        window.history.pushState(
          { index: entry.index + 1, state: location.state } satisfies SessionHistoryState,
          '',
          locationSerializer.stringify(location)
        );

        applyPopstate = noop;
        entry = getActualEntry();
        pubSub.publish();
      });
    },

    replace(to) {
      cancelNavigation();

      cancelNavigation = navigateOrBlock('replace', blockers, parseOrCastLocation(to, locationSerializer), location => {
        window.history.replaceState(
          { index: entry.index, state: location.state } satisfies SessionHistoryState,
          '',
          locationSerializer.stringify(location)
        );

        applyPopstate = noop;
        entry = getActualEntry();
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
