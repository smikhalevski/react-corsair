import { PubSub } from 'parallel-universe';
import { Location } from '../__types';
import { History, HistoryOptions } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { debasePathname, parseLocation, parseOrCastLocation, rebasePathname, stringifyLocation } from './utils';

/**
 * Create the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsAdapter = urlSearchParamsAdapter } = options;
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
      return rebasePathname(basePathname, typeof to === 'string' ? to : stringifyLocation(to, searchParamsAdapter));
    },

    push(to) {
      location = parseOrCastLocation(to, searchParamsAdapter);

      window.history.pushState(
        location.state,
        '',
        rebasePathname(basePathname, stringifyLocation(location, searchParamsAdapter))
      );
      pubSub.publish();
    },

    replace(to) {
      location = parseOrCastLocation(to, searchParamsAdapter);

      window.history.replaceState(
        location.state,
        '',
        rebasePathname(basePathname, stringifyLocation(location, searchParamsAdapter))
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
