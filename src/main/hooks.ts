import { Route } from './__Route';

/**
 * Returns params of a {@link route} or throws if used outside of route component.
 *
 * @param route The route to retrieve params for.
 * @template Params Route params.
 * @group Hooks
 */
export function useRouteParams<Params extends object | void>(route: Route<any, Params>): Params {
  return undefined!;
}

/**
 * Returns data loaded for a {@link route} or throws if used outside of route component.
 *
 * @param route The route to retrieve data for.
 * @template Data Data loaded by a route.
 * @group Hooks
 */
export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  return undefined!;
}

/**
 * Returns an error that occurred during route content loading, or during rendering.
 *
 * If there's no then `undefined` is returned.
 *
 * @group Hooks
 */
export function useRouteError(): any {
  return undefined!;
}
