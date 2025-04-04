import { Location, To } from './types';
import { toLocation } from './utils';

/**
 * Throws a {@link Redirect} instance that redirects router to a {@link to location}.
 *
 * @param to A location or a URL to redirect to.
 * @group Routing
 */
export function redirect(to: To | string): never {
  throw new Redirect(typeof to === 'string' ? to : toLocation(to));
}

/**
 * A redirect to a location.
 *
 * Use {@link redirect} to throw a {@link Redirect} instance.
 *
 * @group Routing
 */
export class Redirect {
  /**
   * Creates a new {@link Redirect} instance.
   *
   * @param to A location or a URL to redirect to.
   */
  constructor(public to: Location | string) {}
}
