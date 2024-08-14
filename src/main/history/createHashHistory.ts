import { PubSub } from 'parallel-universe';
import { Location } from '../__types';
import { toLocation } from '../utils';
import { History, HistoryOptions } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseURL, toURL } from './utils';

/**
 * Create the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 */
export function createHashHistory(options: HistoryOptions = {}): History {
  const { base, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();
  const baseURL = base === undefined ? undefined : new URL(base);

  let prevHref: string;
  let location: Location;

  return {
    get location() {
      const href = decodeURIComponent(window.location.hash.substring(1));

      if (prevHref !== href) {
        prevHref = href;
        location = parseURL(href, searchParamsAdapter);
      }
      return location;
    },

    toURL(location) {
      const url = '#' + encodeURIComponent(toURL(location, searchParamsAdapter));

      return baseURL === undefined ? url : new URL(url, baseURL).toString();
    },

    push(to) {
      location = toLocation(to);
      window.history.pushState(location.state, '', '#' + encodeURIComponent(toURL(location, searchParamsAdapter)));
      pubSub.publish();
    },

    replace(to) {
      location = toLocation(to);
      window.history.replaceState(location.state, '', '#' + encodeURIComponent(toURL(location, searchParamsAdapter)));
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
