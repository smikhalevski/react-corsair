import { PubSub } from 'parallel-universe';
import { toLocation } from '../utils';
import { History, SearchParamsAdapter } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseURL, toURL } from './utils';

/**
 * Options of {@link createBrowserHistory}.
 */
export interface BrowserHistoryOptions {
  /**
   * A URL base used by {@link History.toURL}.
   *
   * @default window.location.origin
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
  const { base: defaultBase = window.location.origin, searchParamsAdapter = urlSearchParamsAdapter } = options;
  const pubSub = new PubSub();

  let location = parseURL(window.location.href, searchParamsAdapter);

  window.addEventListener('popstate', () => {
    location = parseURL(window.location.href, searchParamsAdapter);
    pubSub.publish();
  });

  return {
    get location() {
      return location;
    },

    toURL(location, base = defaultBase) {
      return new URL(toURL(location, searchParamsAdapter), base);
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
      return pubSub.subscribe(listener);
    },
  };
}
