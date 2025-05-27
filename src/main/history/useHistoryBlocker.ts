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
 * transaction !== null && (
 *   <dialog open={true}>
 *     <p>{'Discard unsaved changes?'}</p>
 *
 *     <button onClick={transaction.proceed}>{'Discard'}</button>
 *     <button onClick={transaction.cancel}>{'Cancel'}</button>
 *   </dialog>
 * )
 *
 * @param blocker A history navigation blocker or a boolean that indicates whether blocker is blocked or not.
 * - If `true` (or the callback returns `true`) then the transaction is blocked and the hook returns `null`.
 * - If `false` (or the callback returns `false`) then the transaction isn't blocked and the hook returns `null`.
 * - If `undefined` (or the callback returns `undefined`) then the transaction is blocked and the hook returns
 * the pending transaction.
 *
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
      history.block(blockedTransaction => {
        let transaction: HistoryTransaction | null = {
          ...blockedTransaction,

          proceed() {
            transaction = null;
            setTransaction(transaction);
            blockedTransaction.proceed();
          },

          cancel() {
            transaction = null;
            setTransaction(transaction);
            blockedTransaction.cancel();
          },
        };

        const blocker = blockerRef.current;
        const isBlocked = typeof blocker === 'function' ? blocker(transaction) : blocker;

        setTransaction(isBlocked !== undefined || blockedTransaction.type === 'unload' ? null : transaction);

        return isBlocked;
      }),
    [history]
  );

  return transaction;
}
