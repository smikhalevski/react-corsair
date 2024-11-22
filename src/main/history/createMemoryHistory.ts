import { PubSub } from 'parallel-universe';
import { To } from '../types';
import { History, HistoryOptions } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseOrCastLocation, rebasePathname, stringifyLocation } from './utils';

/**
 * Options of {@link createMemoryHistory}.
 *
 * @group History
 */
export interface MemoryHistoryOptions extends HistoryOptions {
  /**
   * A non-empty array of initial history entries.
   */
  initialEntries: Array<To | string>;
}

/**
 * Create the history adapter that reads and writes location to an in-memory stack.
 *
 * @param options History options.
 * @group History
 */
export function createMemoryHistory(options: MemoryHistoryOptions): History {
  const { basePathname, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const entries = options.initialEntries.map(entry => parseOrCastLocation(entry, searchParamsAdapter));

  if (entries.length === 0) {
    throw new Error('Expected at least one initial entry');
  }

  let cursor = entries.length - 1;

  return {
    get url() {
      return this.toURL(this.location);
    },

    get location() {
      return entries[cursor];
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsAdapter);
    },

    toAbsoluteURL(to) {
      return rebasePathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsAdapter));
    },

    push(to) {
      cursor++;

      entries.splice(cursor, entries.length, parseOrCastLocation(to, searchParamsAdapter));
      pubSub.publish();
    },

    replace(to) {
      entries.splice(cursor, entries.length, parseOrCastLocation(to, searchParamsAdapter));
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
