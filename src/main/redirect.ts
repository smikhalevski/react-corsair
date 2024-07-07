import { Route } from './Route';
import { Location, LocationOptions } from './types';

/**
 * Options of the {@link redirect} function.
 */
export interface RedirectOptions extends LocationOptions {
  /**
   * If `true` then [the permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) is rendered.
   *
   * @default false
   */
  isPermanent?: boolean;
}

/**
 * Throws the {@link Redirect} instance that renders the redirect to the given URL.
 */
export function redirect<T extends Route>(route: T, params: T['_params'], options: RedirectOptions = {}): never {
  throw new Redirect(route.getLocation(params, options), options.isPermanent);
}

/**
 * Describes the redirect to a URL.
 */
export class Redirect {
  /**
   * Created a new {@link Redirect} instance.
   *
   * @param location The location to redirect to.
   * @param isPermanent If `true` then
   * [the permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) is rendered.
   */
  constructor(
    public location: Location,
    public isPermanent = false
  ) {}
}
