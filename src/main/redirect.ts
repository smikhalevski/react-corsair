/**
 * Redirects to the given URL.
 */
export function redirect(url: string): never {
  throw new Redirect(url, false);
}

/**
 * Permanently redirects to the given URL.
 */
export function permanentRedirect(url: string): never {
  throw new Redirect(url, true);
}

export class Redirect {
  constructor(
    public url: string,
    public isPermanent: boolean
  ) {}
}
