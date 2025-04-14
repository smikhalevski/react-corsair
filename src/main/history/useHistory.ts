import { createContext, useContext } from 'react';
import { History } from './types';

export const HistoryContext = createContext<History | null>(null);

HistoryContext.displayName = 'HistoryContext';

/**
 * Provides {@link History} instance to nested elements.
 *
 * @group History
 */
export const HistoryProvider = HistoryContext.Provider;

/**
 * Returns a history provided by an enclosing {@link HistoryProvider}.
 *
 * **Note:** {@link useHistory} doesn't re-render a component when a history gets updated.
 *
 * @group History
 */
export function useHistory(): History {
  const history = useContext(HistoryContext);

  if (history === null) {
    throw new Error('Cannot be used outside of a HistoryProvider');
  }

  return history;
}
