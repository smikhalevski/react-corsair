import { createContext, useContext } from 'react';
import { History } from './types';
import { useHistorySubscription } from './useHistorySubscription';

export const HistoryContext = createContext<History | null>(null);

HistoryContext.displayName = 'HistoryContext';

/**
 * Provides {@link History} instance to nested elements.
 */
export const HistoryProvider = HistoryContext.Provider;

/**
 * Returns a history provided by an enclosing {@link HistoryProvider}.
 */
export function useHistory(): History {
  const history = useContext(HistoryContext);

  if (history === null) {
    throw new Error('Cannot be used outside of a HistoryProvider');
  }

  useHistorySubscription(history);

  return history;
}
