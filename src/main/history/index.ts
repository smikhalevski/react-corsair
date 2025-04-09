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

export { createBrowserHistory } from './createBrowserHistory';
export { createHashHistory } from './createHashHistory';
export { createMemoryHistory } from './createMemoryHistory';
export { jsonSearchParamsSerializer } from './jsonSearchParamsSerializer';
export { Link, type LinkProps } from './Link';
export { useHistory, HistoryProvider } from './useHistory';
export { useHistoryBlocker } from './useHistoryBlocker';
export { useHistorySubscription } from './useHistorySubscription';
export { parseLocation, stringifyLocation } from './utils';
export {
  type HistoryOptions,
  type History,
  type HistoryBlocker,
  type HistoryTransactionType,
  type HistoryTransaction,
  type SearchParamsSerializer,
} from './types';
