import { History, HistoryOptions } from './types';
import { concatPathname, debasePathname } from './utils';
import { createSessionHistory } from './createSessionHistory';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';

/**
 * Creates the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return createSessionHistory(
    () => debasePathname(basePathname, window.location.pathname) + window.location.search + window.location.hash,
    url => concatPathname(basePathname, url),
    searchParamsSerializer
  );
}
