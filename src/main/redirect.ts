import { Route } from './types';

/**
 * Redirects the router to the given route.
 *
 * @param route The route to redirect to.
 * @param params Route params.
 */
export function redirect<Params>(route: Route<Params>, params: Params): never {
  throw new Redirect(route, params);
}

export class Redirect<Params> {
  constructor(
    public route: Route<Params>,
    public params: Params
  ) {}
}
