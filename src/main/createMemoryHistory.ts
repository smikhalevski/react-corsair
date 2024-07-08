import { PubSub } from 'parallel-universe';
import { History, Location } from './types';
import { toLocation } from './utils';

/**
 * Options of {@link createMemoryHistory}.
 */
export interface MemoryHistoryOptions {
  /**
   * A non-empty array of initial history entries.
   */
  initialEntries: Location[];
}

/**
 * Create the history adapter that reads and writes location to an in-memory stack.
 *
 * @param options History options.
 */
export function createMemoryHistory(options: MemoryHistoryOptions): History {
  const pubSub = new PubSub();
  const entries = options.initialEntries.slice(0);

  if (entries.length === 0) {
    throw new Error('Expected at least one initial entry');
  }

  let cursor = entries.length - 1;

  return {
    get location() {
      return entries[cursor];
    },

    push(to) {
      entries.push(toLocation(to));
      pubSub.publish();
    },

    replace(to) {
      entries.splice(cursor, entries.length - cursor, toLocation(to));
      pubSub.publish();
    },

    back() {
      if (cursor > 0) {
        cursor--;
        pubSub.publish();
      }
    },

    subscribe(listener) {
      return pubSub.subscribe(listener);
    },
  };
}
