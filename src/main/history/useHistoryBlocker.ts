import { HistoryBlocker, HistoryTransaction } from './types';
import { useHistory } from './useHistory';
import { useEffect, useRef, useState } from 'react';

/**
 * Registers a {@link blocker} that prevents history navigation.
 *
 * @example
 * useHistoryBlocker(() => hasUnsavedChanges && !confirm('Discard unsaved changes?'));
 *
 * @example
 * const transaction = useHistoryBlocker(hasUnsavedChanges);
 *
 * transaction && (
 *   <dialog open={true}>
 *     <p>{'Discard unsaved changes?'}</p>
 *
 *     <button onClick={transaction.proceed}>{'Discard'}</button>
 *     <button onClick={transaction.cancel}>{'Cancel'}</button>
 *   </dialog>
 * )
 *
 * @param blocker A history navigation blocker or a boolean that indicates whether blocker is blocked or not.
 * @returns A pending history transaction that must be cancelled or proceeded. Or `null` if there's no pending blocked
 * transaction.
 * @group History
 */
export function useHistoryBlocker(blocker: boolean | HistoryBlocker): HistoryTransaction | null {
  const blockerRef = useRef(blocker);
  const history = useHistory();
  const [transaction, setTransaction] = useState<HistoryTransaction | null>(null);

  blockerRef.current = blocker;

  useEffect(
    () =>
      history.block(transaction => {
        let tx: HistoryTransaction | null = {
          ...transaction,

          proceed() {
            tx = null;
            setTransaction(tx);
            transaction.proceed();
          },

          cancel() {
            tx = null;
            setTransaction(tx);
            transaction.cancel();
          },
        };

        const isBlocked = typeof blockerRef.current === 'function' ? blockerRef.current(tx) : blockerRef.current;

        setTransaction(tx);

        return isBlocked;
      }),
    [history]
  );

  return transaction;
}
