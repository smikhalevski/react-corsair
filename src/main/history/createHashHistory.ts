import { PubSub } from 'parallel-universe';
import { Location } from '../types';
import { toLocation } from '../utils';
import { History, HistoryOptions } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseLocation, rebasePathname, stringifyLocation } from './utils';

/**
 * Create the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 */
export function createHashHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();

  let prevHref: string;
  let location: Location;

  return {
    get location() {
      const href = decodeURIComponent(window.location.hash.substring(1));

      if (prevHref !== href) {
        prevHref = href;
        location = parseLocation(href, searchParamsAdapter);
      }
      return location;
    },

    toURL(to) {
      return rebasePathname(
        basePathname,
        '#' + encodeURIComponent(typeof to === 'string' ? to : stringifyLocation(to, searchParamsAdapter))
      );
    },

    push(to) {
      location = typeof to === 'string' ? parseLocation(to, searchParamsAdapter) : toLocation(to);

      to = stringifyLocation(location, searchParamsAdapter);
      window.history.pushState(location.state, '', '#' + encodeURIComponent(to));
      pubSub.publish();
    },

    replace(to) {
      location = typeof to === 'string' ? parseLocation(to, searchParamsAdapter) : toLocation(to);

      to = stringifyLocation(location, searchParamsAdapter);
      window.history.replaceState(location.state, '', '#' + encodeURIComponent(to));
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
