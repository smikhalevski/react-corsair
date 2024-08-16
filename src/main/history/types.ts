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
   * An adapter that extracts params from a URL search string and stringifies them back. By default, an adapter that
   * relies on {@link !URLSearchParams} is used.
   */
  searchParamsAdapter?: SearchParamsAdapter;
}

/**
 * A history abstraction.
 *
 * @group History
 */
export interface History {
  /**
   * The current history location.
   */
  readonly location: Location;

  /**
   * Creates a pathname-search-hash string for a given location.
   *
   * If history was initialized with a {@link HistoryOptions.basePathname basePathname} then it is prepended to the
   * returned URL.
   *
   * @param to A location to create a URL for.
   */
  toURL(to: To | string): string;

  /**
   * Adds an entry to the history stack.
   *
   * @param to A location to navigate to.
   * @example
   * const userRoute = createRoute('/users/:userId');
   * history.push(userRoute.getLocation({ userId: 42 }));
   * // or
   * history.push('/users/42');
   */
  push(to: To | string): void;

  /**
   * Modifies the current history entry, replacing it with the state object and URL passed in the method parameters.
   *
   * @param to A location to navigate to.
   * @example
   * const userRoute = createRoute('/users/:userId');
   * history.replace(userRoute.getLocation({ userId: 42 }));
   * // or
   * history.replace('/users/42');
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
}

/**
 * Extracts params from a URL search string and stringifies them back.
 *
 * @group History
 */
export interface SearchParamsAdapter {
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
