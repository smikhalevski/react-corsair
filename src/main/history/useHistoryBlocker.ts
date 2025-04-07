import { HistoryBlocker } from './types';
import { useHistory } from './useHistory';
import { useEffect, useRef } from 'react';

/**
 * Registers a {@link blocker} that prevents history navigation.
 *
 * @example
 * useHistoryBlocker(() => hasUnsavedChanges && !confirm('Discard unsaved changes?'));
 *
 * @param blocker A history navigation blocker.
 * @group History
 */
export function useHistoryBlocker(blocker: HistoryBlocker): void {
  const blockerRef = useRef(blocker);
  const history = useHistory();

  blockerRef.current = blocker;

  useEffect(() => history.registerBlocker(transaction => blockerRef.current(transaction)), [history]);
}
