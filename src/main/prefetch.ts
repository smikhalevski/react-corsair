import { Route } from './types';

/**
 * Prefetches the component and data for the given route.
 *
 * @param route The route to prefetch.
 * @param params The validated route params.
 */
export function prefetch<Params>(route: Route<Params>, params: Params): void {
  route.renderer(params);
}
