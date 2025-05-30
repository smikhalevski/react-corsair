import { History, HistoryOptions } from './types.js';
import { concatPathname } from './utils.js';
import { createSessionHistory } from './createSessionHistory.js';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';

/**
 * Creates the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 * @group History
 */
export function createHashHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return createSessionHistory({
    searchParamsSerializer,
    getURL: () => decodeURIComponent(window.location.hash.substring(1)),
    toAbsoluteURL: url => concatPathname(basePathname, '#' + url),
  });
}
