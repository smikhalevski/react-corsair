import { Location, To } from './types.js';
import { toLocation } from './utils.js';

/**
 * Throws a {@link Redirect} instance that redirects router to a {@link to location}.
 *
 * @param to A location or a URL to redirect to.
 * @group Routing
 */
export function redirect(to: To | string): never {
  throw new Redirect(to);
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
   *  A location or a URL to redirect to.
   */
  readonly to: Location | string;

  /**
   * Creates a new {@link Redirect} instance.
   *
   * @param to A location or a URL to redirect to.
   */
  constructor(to: To | string) {
    this.to = typeof to === 'string' ? to : toLocation(to);
  }
}
