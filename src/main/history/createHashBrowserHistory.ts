import { BrowserHistory, HistoryOptions } from './types.js';
import { createHashLocationSerializer } from './utils.js';
import { createSessionHistory } from './createSessionHistory.js';

/**
 * Creates the history adapter that reads and writes location to a browser's session history using only URL hash.
 *
 * @param options History options.
 * @group History
 */
export function createHashBrowserHistory(options?: HistoryOptions): BrowserHistory {
  return createSessionHistory(createHashLocationSerializer(options));
}
