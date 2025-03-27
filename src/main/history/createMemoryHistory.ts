import { PubSub } from 'parallel-universe';
import { To } from '../types';
import { History, HistoryOptions } from './types';
import { concatPathname, jsonSearchParamsAdapter, parseOrCastLocation, stringifyLocation } from './utils';

/**
 * Create the history adapter that reads and writes location to an in-memory stack.
 *
 * @param initialEntries A non-empty array of initial history entries.
 * @param options History options.
 * @group History
 */
export function createMemoryHistory(initialEntries: Array<To | string>, options: HistoryOptions = {}): History {
  const { basePathname, searchParamsAdapter = jsonSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const entries = initialEntries.map(entry => parseOrCastLocation(entry, searchParamsAdapter));

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
      return concatPathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsAdapter));
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
