import { PubSub } from 'parallel-universe';
import { To } from '../types.js';
import { History, HistoryBlocker, HistoryOptions } from './types.js';
import { createLocationSerializer, navigateOrBlock, parseOrCastLocation } from './utils.js';
import { noop, toLocation } from '../utils.js';

/**
 * Options of the {@link createMemoryHistory}.
 *
 * @group History
 */
export interface MemoryHistoryOptions extends HistoryOptions {
  /**
   * A non-empty array of initial history entries. If an entry is a string, it should start with
   * the {@link HistoryOptions.basePathname basePathname}.
   */
  initialEntries: Array<To | string>;
}

/**
 * Creates the history adapter that reads and writes location to an in-memory stack.
 *
 * @param options History options.
 * @group History
 */
export function createMemoryHistory(options: MemoryHistoryOptions): History {
  const { initialEntries } = options;

  if (initialEntries.length === 0) {
    throw new Error('Expected at least one initial entry');
  }

  const go = (delta: number): void => {
    if (entryIndex + delta < 0 || entryIndex + delta >= entries.length) {
      return;
    }

    cancelNavigation();

    cancelNavigation = navigateOrBlock('pop', blockers, entries[entryIndex + delta], () => {
      entryIndex += delta;
      pubSub.publish();
    });
  };

  const locationSerializer = createLocationSerializer(options);
  const entries = initialEntries.map(entry => parseOrCastLocation(entry, locationSerializer));
  const blockers = new Set<HistoryBlocker>();
  const pubSub = new PubSub();

  let cancelNavigation = noop;
  let entryIndex = entries.length - 1;

  return {
    get url() {
      return locationSerializer.stringify(this.location);
    },

    get location() {
      return entries[entryIndex];
    },

    get canGoBack() {
      return entryIndex !== 0;
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
        entryIndex++;
        entries.splice(entryIndex, entries.length, location);
        pubSub.publish();
      });
    },

    replace(to) {
      cancelNavigation();

      cancelNavigation = navigateOrBlock('replace', blockers, parseOrCastLocation(to, locationSerializer), location => {
        entries.splice(entryIndex, entries.length, location);
        pubSub.publish();
      });
    },

    back() {
      go(-1);
    },

    forward() {
      go(1);
    },

    go,

    subscribe(listener) {
      return pubSub.subscribe(listener);
    },

    block(blocker) {
      blockers.add(blocker);

      return () => {
        blockers.delete(blocker);
      };
    },
  };
}
