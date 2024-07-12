import { PubSub } from 'parallel-universe';
import { Location } from '../types';
import { History, SearchParamsAdapter } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { toLocation } from '../utils';
import { toURL } from './utils';

/**
 * Options of {@link createMemoryHistory}.
 */
export interface MemoryHistoryOptions {
  /**
   * A non-empty array of initial history entries.
   */
  initialEntries: Location[];

  /**
   * A URL base used by {@link History.toURL}.
   *
   * If omitted a base should be specified with each {@link History.toURL} call, otherwise an error is thrown.
   */
  base?: URL | string;

  /**
   * An adapter that extracts params from a URL search string and stringifies them back. By default, an adapter that
   * relies on {@link !URLSearchParams} is used.
   */
  searchParamsAdapter?: SearchParamsAdapter;
}

/**
 * Create the history adapter that reads and writes location to an in-memory stack.
 *
 * @param options History options.
 */
export function createMemoryHistory(options: MemoryHistoryOptions): History {
  const { base: defaultBase, searchParamsAdapter = urlSearchParamsAdapter } = options;
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

    toURL(location, base = defaultBase) {
      if (base === undefined) {
        throw new Error('No base URL provided');
      }
      return new URL(toURL(location, searchParamsAdapter), base);
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
