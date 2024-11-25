import { RouteMatch } from './__matchRoutes';
import { NotFoundError } from './__notFound';
import { Redirect } from './__redirect';
import { isPromiseLike } from './__utils';
import { OutletPayload } from './OutletModel';

/**
 * Loads a route component and data.
 */
export function loadRoute(
  routeMatch: RouteMatch,
  context: unknown,
  signal: AbortSignal,
  isPreload: boolean
): Promise<OutletPayload> | OutletPayload {
  const { route, params } = routeMatch;

  let component;
  let data;

  try {
    component = route.loadComponent();

    data = route.loader === undefined ? undefined : route.loader({ params, context, signal, isPreload });
  } catch (error) {
    return createErrorPayload(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(result => createOkPayload(result[1]), createErrorPayload);
  }

  return createOkPayload(data);
}

export function createOkPayload(data: unknown): OutletPayload {
  return { status: 'ok', data };
}

export function createErrorPayload(error: unknown): OutletPayload {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
