export interface RedirectOptions {
  isPermanent?: boolean;
}

/**
 * Throws {@link Redirect} that renders the redirect to the given URL.
 *
 * @param url The URL to redirect to.
 * @param options Redirect options.
 */
export function redirect(url: string, options?: RedirectOptions): never {
  throw new Redirect(url, options?.isPermanent);
}

/**
 * Describes the redirect to a URL.
 */
export class Redirect {
  /**
   * Created a new {@link Redirect} instance.
   *
   * @param url The URL to redirect to.
   * @param isPermanent If `true` then
   * [the permanent redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) is rendered.
   */
  constructor(
    public url: string,
    public isPermanent = false
  ) {}
}
