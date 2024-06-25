/**
 * Redirects the router to the given route.
 */
export function redirect(url: string): never {
  throw new Redirect(url);
}

export class Redirect {
  constructor(public url: string) {}
}
