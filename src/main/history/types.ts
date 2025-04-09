import { Dict, Location, To } from '../types';

/**
 * A history abstraction.
 *
 * @group History
 */
export interface History {
  /**
   * A history-local URL that represents {@link location}.
   */
  readonly url: string;

  /**
   * The current history location.
   */
  readonly location: Location;

  /**
   * Returns a history-local URL.
   *
   * This URL can be passed to {@link push} and {@link replace} as an argument.
   */
  toURL(to: To): string;

  /**
   * Creates an absolute URL for a given location. If history was initialized with
   * a {@link HistoryOptions.basePathname basePathname} then it is prepended to the returned URL.
   *
   * **Note:** The returned URL is incompatible with {@link push} and {@link replace} methods.
   *
   * @param to A location or {@link toURL a history-local URL} to create an absolute URL for.
   */
  toAbsoluteURL(to: To | string): string;

  /**
   * Adds an entry to the history stack.
   *
   * @example
   * const userRoute = createRoute('/users/:userId');
   * history.push(userRoute.getLocation({ userId: 42 }));
   * // or
   * history.push('/users/42');
   *
   * @param to A location to navigate to or {@link toURL a history-local URL}.
   */
  push(to: To | string): void;

  /**
   * Modifies the current history entry, replacing it with the state object and URL passed in the method parameters.
   *
   * @example
   * const userRoute = createRoute('/users/:userId');
   * history.replace(userRoute.getLocation({ userId: 42 }));
   * // or
   * history.replace('/users/42');
   *
   * @param to A location to navigate to or {@link toURL a history-local URL}.
   */
  replace(to: To | string): void;

  /**
   * Move back one page in the history.
   */
  back(): void;

  /**
   * Move forward one page in the history.
   */
  forward(): void;

  /**
   * Move forwards and backwards through the history depending on the {@link delta}.
   *
   * @param delta The position in the history to which you want to move, relative to the current page. A negative value
   * moves backwards, a positive value moves forwards.
   */
  go(delta: number): void;

  /**
   * Subscribe to location changes.
   *
   * @param listener A listener to subscribe.
   * @returns A callback to unsubscribe a listener.
   */
  subscribe(listener: () => void): () => void;

  /**
   * Registers a {@link blocker} that prevents navigation with history.
   *
   * @param blocker A blocker to register.
   * @returns A callback that removes blocker.
   */
  block(blocker: HistoryBlocker): () => void;
}

/**
 * The transaction type:
 *
 * <dl>
 * <dt>"push"</dt>
 * <dd>The new {@link location} is intended to be pushed to the history stack.</dd>
 * <dt>"replace"</dt>
 * <dd>The new {@link location} is intended to replace the current location on the history stack.</dd>
 * <dt>"pop"</dt>
 * <dd>The user navigated to a {@link location} that was previously visited by clicking _Back_ or _Forward_ browser
 * button, or if {@link History.go}, {@link History.back} or {@link History.forward} was called.</dd>
 * <dt>"unload"</dt>
 * <dd>The user is trying to close the window.</dd>
 * </dl>
 *
 * @group History
 */
export type HistoryTransactionType = 'push' | 'replace' | 'pop' | 'unload';

/**
 * An intended history transaction.
 *
 * If {@link type} is "unload" then the transaction cannot be handled asynchronously.
 *
 * @group History
 */
export interface HistoryTransaction {
  /**
   * The transaction type.
   */
  type: HistoryTransactionType;

  /**
   * A location to which navigation is intended.
   */
  location: Location;

  /**
   * Proceeds with navigation to a {@link location}. If there are enqueued blockers, they are called.
   */
  proceed(): void;

  /**
   * Cancels navigation and prevents enqueued blockers invocation.
   */
  cancel(): void;
}

/**
 * A callback that is called when a history navigation is intended.
 *
 * @example
 * const blocker: HistoryBlocker = transaction => {
 *   return hasUnsavedChanges && !confirm('Discard unsaved changes?')
 * };
 *
 * @example
 * const blocker: HistoryBlocker = transaction => {
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
 * };
 *
 * @param transaction A transaction that describes the intended navigation.
 * @returns `true` or `undefined` if the transaction should be blocked until {@link HistoryTransaction.proceed} is
 * called, or `false` if the transaction shouldn't be blocked.
 * @group History
 */
export type HistoryBlocker = (transaction: HistoryTransaction) => boolean | void;

/**
 * @group History
 */
export interface HistoryOptions {
  /**
   * A base pathname.
   */
  basePathname?: string;

  /**
   * Serializes/parses a URL search string.
   *
   * @default {@link jsonSearchParamsSerializer}
   */
  searchParamsSerializer?: SearchParamsSerializer;
}

/**
 * Extracts params from a URL search string and stringifies them back.
 *
 * @group History
 */
export interface SearchParamsSerializer {
  /**
   * Extract params from a URL search string.
   *
   * @param search The URL search string to extract params from.
   */
  parse(search: string): Dict;

  /**
   * Stringifies params as a search string.
   *
   * @param params Params to stringify.
   */
  stringify(params: Dict): string;
}
