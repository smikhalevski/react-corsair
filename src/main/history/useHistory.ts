import { createContext, useContext } from 'react';
import { History } from './types';

export const HistoryContext = createContext<History | null>(null);

HistoryContext.displayName = 'HistoryContext';

/**
 * Provides {@link History} instance to nested elements.
 *
 * @group Hooks
 */
export const HistoryProvider = HistoryContext.Provider;

/**
 * Returns a history provided by an enclosing {@link HistoryProvider}.
 *
 * **Note:** {@link useHistory} doesn't re-render a component when a history gets updated.
 * Use {@link useHistorySubscription} to re-render a component when a location is changed.
 *
 * @group Hooks
 */
export function useHistory(): History {
  const history = useContext(HistoryContext);

  if (history === null) {
    throw new Error('Cannot be used outside of a HistoryProvider');
  }

  return history;
}
