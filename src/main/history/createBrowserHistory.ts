import { History, HistoryOptions } from './types.js';
import { concatPathname, debasePathname } from './utils.js';
import { createSessionHistory } from './createSessionHistory.js';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';

/**
 * Creates the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return createSessionHistory({
    searchParamsSerializer,

    getURL() {
      return debasePathname(basePathname, window.location.pathname) + window.location.search + window.location.hash;
    },

    toAbsoluteURL(url) {
      return concatPathname(basePathname, url);
    },
  });
}
