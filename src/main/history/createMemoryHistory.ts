import { PubSub } from 'parallel-universe';
import { Location } from '../types';
import { toLocation } from '../utils';
import { History, HistoryOptions } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { toURL } from './utils';

/**
 * Options of {@link createMemoryHistory}.
 */
export interface MemoryHistoryOptions extends HistoryOptions {
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
  const { base, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const entries = options.initialEntries.slice(0);
  const baseURL = base === undefined ? undefined : new URL(base);

  if (entries.length === 0) {
    throw new Error('Expected at least one initial entry');
  }

  let cursor = entries.length - 1;

  return {
    get location() {
      return entries[cursor];
    },

    toURL(to) {
      return toURL(toLocation(to), searchParamsAdapter, baseURL);
    },

    push(to) {
      cursor++;
      entries.splice(cursor, entries.length, toLocation(to));
      pubSub.publish();
    },

    replace(to) {
      entries.splice(cursor, entries.length, toLocation(to));
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
