import { Route } from './Route';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { LoaderOptions } from './types';
import { isPromiseLike } from './utils';

/**
 * A payload with route data.
 */
export interface RoutePayload {
  /**
   * A status of a route loading.
   */
  status: 'ok' | 'error' | 'not_found' | 'redirect';

  /**
   * A status-dependent data.
   */
  data: any;
}

/**
 * Loads a route component and data.
 */
export function loadRoute(route: Route, loaderOptions: LoaderOptions): Promise<RoutePayload> | RoutePayload {
  let component;
  let data;

  try {
    component = route.loadComponent();

    data = route.loader === undefined ? undefined : route.loader(loaderOptions);
  } catch (error) {
    return createErrorPayload(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(result => createOkPayload(result[1]), createErrorPayload);
  }

  return createOkPayload(data);
}

export function createOkPayload(data: unknown): RoutePayload {
  return { status: 'ok', data };
}

export function createErrorPayload(error: unknown): RoutePayload {
  if (error instanceof NotFoundError) {
    return { status: 'not_found', data: undefined };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', data: error.to };
  }

  return { status: 'error', data: error };
}
