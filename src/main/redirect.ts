import { Location, To } from './types';
import { toLocation } from './utils';

/**
 * Options of the {@link redirect} function.
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
 */
export function redirect(to: To, options?: RedirectOptions): never {
  throw new Redirect(toLocation(to), options?.isPermanent);
}

/**
 * A redirect to a location.
 */
export class Redirect {
  /**
   * Creates a new {@link Redirect} instance.
   *
   * @param location A location to redirect to.
   * @param isPermanent If `true` then
   * [the permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) is rendered.
   */
  constructor(
    public location: Location,
    public isPermanent = false
  ) {}
}
