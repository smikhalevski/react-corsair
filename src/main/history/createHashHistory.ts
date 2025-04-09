import { History, HistoryOptions } from './types';
import { concatPathname } from './utils';
import { createSessionHistory } from './createSessionHistory';
import { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';

/**
 * Creates the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 * @group History
 */
export function createHashHistory(options: HistoryOptions = {}): History {
  const { basePathname, searchParamsSerializer = jsonSearchParamsSerializer } = options;

  return createSessionHistory(
    () => decodeURIComponent(window.location.hash.substring(1)),
    url => concatPathname(basePathname, '#' + encodeHash(url)),
    searchParamsSerializer
  );
}

function encodeHash(str: string): string {
  return str.replace(/[^-?/:@._~!$&'()*+,;=\w]/g, encodeURIComponent);
}
