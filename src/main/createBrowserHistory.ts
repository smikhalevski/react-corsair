import { PubSub } from 'parallel-universe';
import { Dict, History } from './types';
import { urlSearchParamsAdapter } from './urlSearchParamsAdapter';
import { parseURL, toLocation, toURL } from './utils';

/**
 * Extracts params from a URL search string and stringifies them back.
 */
export interface SearchParamsAdapter {
  /**
   * Extract params from a URL search string.
   *
   * @param search The URL search string to extract params from.
   */
  parse(search: string): Dict;

  /**
   * Stringifies params as a search string.
   *
   * @param params Params to stringify.
   */
  stringify(params: Dict): string;
}

/**
 * Options of {@link createBrowserHistory}.
 */
export interface BrowserHistoryOptions {
  /**
   * An adapter that extracts params from a URL search string and stringifies them back. By default,
   * an adapter that relies on {@link !URLSearchParams} is used.
   */
  searchParamsAdapter?: SearchParamsAdapter;
}

/**
 * Create the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 */
export function createBrowserHistory(options?: BrowserHistoryOptions): History {
  const pubSub = new PubSub();
  const searchParamsAdapter = options?.searchParamsAdapter || urlSearchParamsAdapter;

  let location = parseURL(window.location.href, searchParamsAdapter);

  window.addEventListener('popstate', () => {
    location = parseURL(window.location.href, searchParamsAdapter);
    pubSub.publish();
  });

  return {
    get location() {
      return location;
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
