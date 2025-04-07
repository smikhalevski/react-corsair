import { PubSub } from 'parallel-universe';
import { Location } from '../types';
import { History, HistoryOptions } from './types';
import { concatPathname, parseLocation, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';

/**
 * Creates the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 * @group History
 */
export function createHashHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();

  let prevHref: string;
  let location: Location;

  return {
    get url() {
      return this.toURL(this.location);
    },

    get index() {
      return 0;
    },

    get length() {
      return 0;
    },

    get location() {
      const href = decodeURIComponent(window.location.hash.substring(1));

      if (prevHref !== href) {
        prevHref = href;
        location = parseLocation(href, searchParamsSerializer);
      }
      return location;
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsSerializer);
    },

    toAbsoluteURL(to) {
      return concatPathname(
        basePathname,
        '#' + encodeHash(typeof to === 'string' ? to : stringifyLocation(to, searchParamsSerializer))
      );
    },

    push(to) {
      location = parseOrCastLocation(to, searchParamsSerializer);

      window.history.pushState(
        location.state,
        '',
        '#' + encodeHash(stringifyLocation(location, searchParamsSerializer))
      );
      pubSub.publish();
    },

    replace(to) {
      location = parseOrCastLocation(to, searchParamsSerializer);

      window.history.replaceState(
        location.state,
        '',
        '#' + encodeHash(stringifyLocation(location, searchParamsSerializer))
      );
      pubSub.publish();
    },

    back() {
      window.history.back();
    },

    subscribe(listener) {
      if (pubSub.listenerCount === 0) {
        window.addEventListener('popstate', handlePopstate);
      }

      const unsubscribe = pubSub.subscribe(listener);

      return () => {
        unsubscribe();

        if (pubSub.listenerCount === 0) {
          window.removeEventListener('popstate', handlePopstate);
        }
      };
    },

    registerBlocker(blocker) {
      return () => {};
    },
  };
}

function encodeHash(str: string): string {
  return str.replace(/[^-?/:@._~!$&'()*+,;=\w]/g, encodeURIComponent);
}
