import { Dict, Location, To } from '../types';

export interface HistoryOptions {
  /**
   * A default URL base used by {@link History.toURL}.
   */
  base?: URL | string;

  /**
   * An adapter that extracts params from a URL search string and stringifies them back. By default, an adapter that
   * relies on {@link !URLSearchParams} is used.
   */
  searchParamsAdapter?: SearchParamsAdapter;
}

/**
 * A history abstraction.
 */
export interface History {
  /**
   * The current history location.
   */
  readonly location: Location;

  /**
   * Creates a URL for a given location.
   *
   * @param location A location to create a URL for.
   * @param base A URL base.
   */
  toURL(location: Location, base?: URL | string): string;

  /**
   * Adds an entry to the history stack.
   *
   * @param to A location to navigate to.
   */
  push(to: To): void;

  /**
   * Modifies the current history entry, replacing it with the state object and URL passed in the method parameters.
   *
   * @param to A location to navigate to.
   */
  replace(to: To): void;

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
