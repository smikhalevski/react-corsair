import { Location, To } from './types';
import { toLocation } from './utils';

/**
 * Options of the {@link redirect} function.
 *
 * @group Routing
 */
export interface RedirectOptions {
  /**
   * If `true` then [the permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) is rendered.
   *
   * @default false
   */
  isPermanent?: boolean;
}

/**
 * Throws a {@link Redirect} instance that redirects router to a location.
 *
 * During SSR, redirects abort rendering. On the client, redirects trigger {@link RouterProps.onReplace}.
 *
 * @group Routing
 */
export function redirect(to: To, options?: RedirectOptions): never {
  throw new Redirect(toLocation(to), options?.isPermanent);
}

/**
 * A redirect to a location.
 *
 * Use {@link redirect} to create a {@link Redirect} instance.
 *
 * @group Routing
 */
export class Redirect {
  /**
   * `true` if a [a permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) must be rendered.
   */
  isPermanent;

  /**
   * Creates a new {@link Redirect} instance.
   *
   * @param location A location to redirect to.
   * @param isPermanent If `true` then
   * [a permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) must be rendered.
   */
  constructor(
    public location: Location,
    isPermanent = false
  ) {
    this.isPermanent = isPermanent;
  }
}
