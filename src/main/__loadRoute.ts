import { RouteMatch } from './__matchRoutes';
import { NotFoundError } from './__notFound';
import { Redirect } from './__redirect';
import { OutletState } from './__types';
import { isPromiseLike } from './__utils';

/**
 * Loads a route component and data.
 */
export function loadRoute(
  routeMatch: RouteMatch,
  context: unknown,
  signal: AbortSignal,
  isPrefetch: boolean
): Promise<OutletState> | OutletState {
  const { route, params } = routeMatch;

  let component;
  let data;

  try {
    component = route.component || route.loadComponent();

    data = route.loader === undefined ? undefined : route.loader({ params, context, signal, isPrefetch });
  } catch (error) {
    return createErrorState(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(result => createOkState(result[1]), createErrorState);
  }

  return createOkState(data);
}

export function createOkState(data: unknown): OutletState {
  return { status: 'ok', data };
}

export function createErrorState(error: unknown): OutletState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
