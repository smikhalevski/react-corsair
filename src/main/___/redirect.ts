/**
 * Throws a {@link Redirect} instance that redirects router to a location.
 *
 * @param url A URL to redirect to.
 * @group Routing
 */
export function redirect(url: string): never {
  throw new Redirect(url);
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
   * @param url A URL to redirect to.
   */
  constructor(public url: string) {}
}
