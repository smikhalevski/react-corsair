import { Route } from './Route';

/**
 * Returns params associated with the rendered route, or `undefined` if route isn't rendered.
 *
 * @param route The route for which params are retrieved.
 */
export function useRouteParams<Params>(route: Route<Params>): Params | undefined {
  return undefined;
}
