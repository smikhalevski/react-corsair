import { HistoryBlocker, HistoryTransaction } from './types.js';
import { useHistory } from './useHistory.js';
import { useEffect, useRef, useState } from 'react';

/**
 * Registers a blocker that prevents history navigation.
 *
 * @example
 * const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 *
 * useHistoryBlocker(transaction => {
 *   return hasUnsavedChanges && !confirm('Discard unsaved changes?')
 * });
 *
 * @example
 * const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 *
 * useHistoryBlocker(transaction => {
 *   if (!hasUnsavedChanges) {
 *     // No unsaved changes, proceed with navigation
 *     transaction.proceed();
 *     return;
 *   }
 *
 *   if (!confirm('Discard unsaved changes?')) {
 *     // User decided to keep unsaved changes
 *     transaction.cancel();
 *   }
 * });
 *
 * @example
 * const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 *
 * const transaction = useHistoryBlocker(() => hasUnsavedChanges);
 * // or
 * const transaction = useHistoryBlocker(hasUnsavedChanges);
 * // or
 * const transaction = useHistoryBlocker();
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
 * @returns A pending navigation transaction that must be cancelled or proceeded. Or `null` if there's no blocked
 * navigation transaction.
 * @group History
 */
export function useHistoryBlocker(blocker?: boolean | HistoryBlocker): HistoryTransaction | null {
  const blockerRef = useRef(blocker);
  const history = useHistory();
  const [transaction, setTransaction] = useState<HistoryTransaction | null>(null);

  blockerRef.current = blocker;

  useEffect(
    () =>
      history.block(actualTransaction => {
        let transaction: HistoryTransaction | null = {
          ...actualTransaction,

          proceed() {
            transaction = null;
            setTransaction(transaction);
            actualTransaction.proceed();
          },

          cancel() {
            transaction = null;
            setTransaction(transaction);
            actualTransaction.cancel();
          },
        };

        const blocker = blockerRef.current;
        const isBlocked = typeof blocker === 'function' ? blocker(transaction) : blocker;

        setTransaction(actualTransaction.type === 'unload' ? null : transaction);

        return isBlocked;
      }),
    [history]
  );

  return transaction;
}
