import { PubSub } from 'parallel-universe';
import { toLocation } from '../utils';
import { History, SearchParamsAdapter } from './types';
import { Location } from '../types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseURL, toURL } from './utils';

/**
 * Options of {@link createBrowserHistory}.
 */
export interface BrowserHistoryOptions {
  /**
   * A default URL base used by {@link History.toURL}.
   */
  base?: URL | string;

  /**
   * An adapter that extracts params from a URL search string and stringifies them back. By default, an adapter that
   * relies on {@link !URLSearchParams} is used.
   */
  searchParamsAdapter?: SearchParamsAdapter;
}

/**
 * Create the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 */
export function createBrowserHistory(options: BrowserHistoryOptions = {}): History {
  const { base: defaultBase, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();
  const handlePopstate = () => pubSub.publish();

  let prevHref: string;
  let location: Location;

  return {
    get location() {
      const { href } = window.location;

      return prevHref === href ? location : (location = parseURL((prevHref = href), searchParamsAdapter));
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
