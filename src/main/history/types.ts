import { Dict, Location, To } from '../types';

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
   * Move back to the previous history entry.
   */
  back(): void;

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
  registerBlocker(blocker: HistoryBlocker): () => void;
}

/**
 * An intended history transaction.
 *
 * @group History
 */
export interface HistoryTransaction {
  /**
   * A location to which navigation is intended.
   */
  location: Location;

  /**
   * Proceeds with navigation to a {@link location}.
   */
  proceed(): void;
}

/**
 * A callback that is called when a history navigation is intended.
 *
 * @param transaction A transaction that describes the navigation.
 * @returns `true` if the transaction should be blocked until {@link HistoryTransaction.proceed} is called,
 * or `false` if the transaction shouldn't be blocked.
 * @group History
 */
export type HistoryBlocker = (transaction: HistoryTransaction) => boolean;

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
