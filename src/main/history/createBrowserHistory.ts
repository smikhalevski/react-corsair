import { BrowserHistory, HistoryOptions } from './types.js';
import { createLocationSerializer } from './utils.js';
import { createSessionHistory } from './createSessionHistory.js';

/**
 * Creates the history adapter that reads and writes location to a browser's session history.
 *
 * @param options History options.
 * @group History
 */
export function createBrowserHistory(options?: HistoryOptions): BrowserHistory {
  return createSessionHistory(createLocationSerializer(options));
}
