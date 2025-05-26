/**
 * The React Corsair history management.
 *
 * ```ts
 * import { createBrowserHistory } from 'react-corsair/history';
 *
 * const history = createBrowserHistory();
 * ```
 *
 * @module history
 */

export { createBrowserHistory } from './createBrowserHistory.js';
export { createHashHistory } from './createHashHistory.js';
export { createMemoryHistory } from './createMemoryHistory.js';
export { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';
export { Link, type LinkProps } from './Link.js';
export { useHistory, HistoryProvider } from './useHistory.js';
export { useHistoryBlocker } from './useHistoryBlocker.js';
export { parseLocation, stringifyLocation } from './utils.js';
export {
  type HistoryOptions,
  type History,
  type HistoryBlocker,
  type HistoryTransactionType,
  type HistoryTransaction,
  type SearchParamsSerializer,
} from './types.js';
