import { PubSub } from 'parallel-universe';
import { Location } from '../__types';
import { toLocation } from '../utils';
import { History, HistoryOptions } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseURL, toURL } from './utils';

/**
 * Create the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { base, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();
  const baseURL = base === undefined ? undefined : new URL(base);

  let prevHref: string;
  let location: Location;

  return {
    get location() {
      const { href } = window.location;

      if (prevHref !== href) {
        prevHref = href;
        location = parseURL(href, searchParamsAdapter, baseURL);
      }
      return location;
    },

    toURL(location) {
      return toURL(location, searchParamsAdapter, baseURL);
    },

    push(to) {
      location = toLocation(to);
      window.history.pushState(location.state, '', toURL(location, searchParamsAdapter, baseURL));
      pubSub.publish();
    },

    replace(to) {
      location = toLocation(to);
      window.history.replaceState(location.state, '', toURL(location, searchParamsAdapter, baseURL));
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
