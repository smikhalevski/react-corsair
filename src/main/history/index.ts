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
export { jsonSearchParamsAdapter } from './jsonSearchParamsAdapter';
export { Link, type LinkProps } from './Link';
export { useHistory, HistoryProvider } from './useHistory';
export { useHistorySubscription } from './useHistorySubscription';
export { parseLocation, stringifyLocation } from './utils';
export { type HistoryOptions, type History, type SearchParamsAdapter } from './types';
