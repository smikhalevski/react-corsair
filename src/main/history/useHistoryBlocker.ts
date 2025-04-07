import { HistoryBlocker } from './types';
import { useHistory } from './useHistory';
import { useEffect } from 'react';

/**
 * Registers a {@link blocker} that prevents navigation with history, and unregisters it when component unmounts.
 *
 * @param blocker A blocker to register.
 * @group History
 */
export function useHistoryBlocker(blocker: HistoryBlocker): void {
  const history = useHistory();

  useEffect(() => history.registerBlocker(blocker), [history]);
}
