import { PubSub } from 'parallel-universe';
import { Location } from '../types';
import { History, HistoryOptions } from './types';
import { concatPathname, debasePathname, parseLocation, parseOrCastLocation, stringifyLocation } from './utils';
import { jsonSearchParamsAdapter } from './jsonSearchParamsAdapter';

/**
 * Create the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsAdapter = jsonSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();

  let prevHref: string;
  let location: Location;

  return {
    get url() {
      return this.toURL(this.location);
    },

    get location() {
      const { pathname, search, hash } = window.location;
      const href = pathname + search + hash;

      if (prevHref !== href) {
        prevHref = href;
        location = parseLocation(debasePathname(basePathname, href), searchParamsAdapter);
      }
      return location;
    },

    toURL(to) {
      return stringifyLocation(to, searchParamsAdapter);
    },

    toAbsoluteURL(to) {
      return concatPathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsAdapter));
    },

    push(to) {
      location = parseOrCastLocation(to, searchParamsAdapter);

      window.history.pushState(
        location.state,
        '',
        concatPathname(basePathname, stringifyLocation(location, searchParamsAdapter))
      );
      pubSub.publish();
    },

    replace(to) {
      location = parseOrCastLocation(to, searchParamsAdapter);

      window.history.replaceState(
        location.state,
        '',
        concatPathname(basePathname, stringifyLocation(location, searchParamsAdapter))
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
  };
}
