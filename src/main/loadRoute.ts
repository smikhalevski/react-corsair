import { RouteMatch } from './matchRoutes';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { RouteState } from './types';
import { isPromiseLike } from './utils';

/**
 * Loads a route component and data.
 *
 * {@link Route.loadComponent A route component} is loaded once and cached forever, while data is loaded anew on every
 * {@link loadRoute} call.
 */
export function loadRoute(
  routeMatch: RouteMatch,
  context: unknown,
  signal: AbortSignal,
  isPrefetch: boolean
): Promise<RouteState> | RouteState {
  const { route, params } = routeMatch;

  let component;
  let data;

  try {
    component = route.loadComponent();

    data = route.dataLoader === undefined ? undefined : route.dataLoader({ params, context, signal, isPrefetch });
  } catch (error) {
    return createErrorState(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(result => createOkState(result[1]), createErrorState);
  }

  return createOkState(data);
}

export function createOkState(data: unknown): RouteState {
  return { status: 'ok', data };
}

export function createErrorState(error: unknown): RouteState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
