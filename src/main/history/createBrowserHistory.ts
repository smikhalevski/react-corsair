import { PubSub } from 'parallel-universe';
import { Location } from '../types';
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
  const { base: defaultBase, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();

  let prevHref: string;
  let location: Location;

  return {
    get location() {
      const { href } = window.location;

      if (prevHref !== href) {
        prevHref = href;
        location = parseURL(href, searchParamsAdapter);
      }
      return location;
    },

    toURL(location, base = defaultBase) {
      return toURL(location, searchParamsAdapter, base);
    },

    push(to) {
      location = toLocation(to);
      history.pushState(location.state, '', toURL(location, searchParamsAdapter));
      pubSub.publish();
    },

    replace(to) {
      location = toLocation(to);
      history.replaceState(location.state, '', toURL(location, searchParamsAdapter));
      pubSub.publish();
    },

    back() {
      history.back();
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
