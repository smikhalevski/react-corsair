import { BrowserHistory, HistoryOptions } from './types.js';
import { concatPathname } from './utils.js';
import { createSessionHistory } from './createSessionHistory.js';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';

/**
 * Creates the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 * @group History
 */
export function createHashBrowserHistory(options: HistoryOptions = {}): BrowserHistory {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return createSessionHistory({
    searchParamsSerializer,

    getURL() {
      return decodeURIComponent(window.location.hash.substring(1));
    },

    toAbsoluteURL(url) {
      return concatPathname(basePathname, '#' + url);
    },
  });
}
