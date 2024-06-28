import { ComponentType } from 'react';

/**
 * An entry in a history stack. A location contains information about the URL path, as well as possibly some arbitrary
 * state.
 */
export interface Location {
  /**
   * A URL pathname, beginning with a /.
   */
  pathname: string;

  /**
   * A URL search string, beginning with a ?.
   */
  search: string;

  /**
   * A URL fragment identifier, beginning with a #.
   */
  hash: string;

  /**
   * A value of arbitrary data associated with this location.
   */
  state?: unknown;
}

/**
 * The result of {@link LocationMatcher.matchLocation location matching}.
 */
export interface LocationMatch<Params> {
  /**
   * The part of the {@link Location.pathname} that was matched.
   */
  pathname: string;

  /**
   * The unmatched part of the pathname that can be passed to the successive router, or `undefined` if successive
   * routing is forbidden.
   */
  successivePathname?: string;

  /**
   * Parsed and validated location params.
   */
  params: Params;

  /**
   * The matched {@link Location.hash}.
   */
  hash: string;

  /**
   * The matched location state.
   */
  state: unknown;
}

export interface LocationOptions<Params> {
  params: Params;
  hash?: string;
  state?: unknown;
}

export interface LocationMatcher<Params, Context> {
  /**
   * Matches the location and extracts params, or returns `null` if location doesn't satisfy this matcher.
   *
   * @param location The location to match.
   * @param context The router context.
   */
  matchLocation(location: Location, context: Context): LocationMatch<Params> | null;

  /**
   * Creates a location that satisfies this matcher.
   *
   * @param options The location options.
   * @param context The router context.
   */
  createLocation(options: LocationOptions<Params>, context: Context): Location;
}

/**
 * Returns the module import with a default component export, or returns the component itself.
 */
export type ComponentLoader = () => PromiseLike<{ default: ComponentType }> | ComponentType;

export interface NavigateOptions {
  /**
   * If `true` then navigation should replace the current history entry.
   *
   * @default false
   */
  isReplace?: boolean;
}
