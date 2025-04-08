import { PubSub } from 'parallel-universe';
import { To } from '../types';
import { History, HistoryBlocker, HistoryOptions } from './types';
import { concatPathname, debasePathname, navigateOrBlock, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';
import { noop } from '../utils';

/**
 * Creates the history adapter that reads and writes location to an in-memory stack.
 *
 * @param initialEntries A non-empty array of initial history entries.
 * @param options History options.
 * @group History
 */
export function createMemoryHistory(initialEntries: Array<To | string>, options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;
  const pubSub = new PubSub();
  const entries = initialEntries.map(entry =>
    parseOrCastLocation(typeof entry === 'string' ? debasePathname(basePathname, entry) : entry, searchParamsSerializer)
  );

  const blockers = new Set<HistoryBlocker>();

  if (entries.length === 0) {
    throw new Error('Expected at least one initial entry');
  }

  let abort = noop;
  let cursor = entries.length - 1;

  return {
    get url() {
      return this.toURL(this.location);
    },

    get location() {
      return entries[cursor];
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsSerializer);
    },

    toAbsoluteURL(to) {
      return concatPathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsSerializer));
    },

    push(to) {
      abort();
      abort = navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        cursor++;
        entries.splice(cursor, entries.length, location);
        pubSub.publish();
      });
    },

    replace(to) {
      abort();
      abort = navigateOrBlock(blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        entries.splice(cursor, entries.length, location);
        pubSub.publish();
      });
    },

    back() {
      if (cursor === 0) {
        return;
      }

      abort();
      abort = navigateOrBlock(blockers, entries[cursor - 1], () => {
        cursor--;
        pubSub.publish();
      });
    },

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
