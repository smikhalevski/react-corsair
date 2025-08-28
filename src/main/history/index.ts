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
export { createHashBrowserHistory } from './createHashBrowserHistory.js';
export { createMemoryHistory, type MemoryHistoryOptions } from './createMemoryHistory.js';
export { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer.js';
export { Link, type LinkProps } from './Link.js';
export { useHistory, HistoryProvider } from './useHistory.js';
export { useHistoryBlocker } from './useHistoryBlocker.js';
export type {
  BrowserHistory,
  HistoryOptions,
  History,
  HistoryBlocker,
  HistoryTransactionType,
  HistoryTransaction,
} from './types.js';
