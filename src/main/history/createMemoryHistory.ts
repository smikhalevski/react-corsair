import { PubSub } from 'parallel-universe';
import { To } from '../types.js';
import { History, HistoryBlocker, HistoryOptions } from './types.js';
import { concatPathname, debasePathname, navigateOrBlock, parseOrCastLocation, stringifyLocation } from './utils.js';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';
import { noop } from '../utils.js';

/**
 * Creates the history adapter that reads and writes location to an in-memory stack.
 *
 * @param initialEntries A non-empty array of initial history entries. If an entry is a string, it should start with
 * a {@link HistoryOptions.basePathname}.
 * @param options History options.
 * @group History
 */
export function createMemoryHistory(initialEntries: Array<To | string>, options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  const entries = initialEntries.map(entry =>
    parseOrCastLocation(typeof entry === 'string' ? debasePathname(basePathname, entry) : entry, searchParamsSerializer)
  );

  const blockers = new Set<HistoryBlocker>();
  const pubSub = new PubSub();

  let cancel = noop;
  let cursor = entries.length - 1;

  if (cursor === -1) {
    throw new Error('Expected at least one initial entry');
  }

  const go = (delta: number): void => {
    if (cursor + delta < 0 || cursor + delta >= entries.length) {
      return;
    }

    cancel();

    cancel = navigateOrBlock('pop', blockers, entries[cursor + delta], () => {
      cursor += delta;
      pubSub.publish();
    });
  };

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
      cancel();

      cancel = navigateOrBlock('push', blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        cursor++;
        entries.splice(cursor, entries.length, location);
        pubSub.publish();
      });
    },

    replace(to) {
      cancel();

      cancel = navigateOrBlock('replace', blockers, parseOrCastLocation(to, searchParamsSerializer), location => {
        entries.splice(cursor, entries.length, location);
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
