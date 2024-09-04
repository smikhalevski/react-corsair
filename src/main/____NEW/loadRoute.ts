import { ComponentType } from 'react';
import { RouteMatch } from './__matchRoutes';
import { NotFoundError } from './notFound';
import { isPromiseLike } from './utils';

export type RouteState =
  | { status: 'ok'; data: unknown }
  | { status: 'error'; error: unknown }
  | { status: 'notFound' }
  | { status: 'redirect'; url: string };

export interface RouteContent {
  component?: ComponentType;
  state: RouteState;
}

/**
 * Unconditionally loads route content.
 */
export function loadRoute(routeMatch: RouteMatch, context: unknown): Promise<RouteContent> | RouteContent {
  let component;
  let data;

  try {
    component = routeMatch.route.getComponent();

    data = routeMatch.route.loader?.(routeMatch.params, context);
  } catch (error) {
    return createErrorContent(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(pair => createOkContent(pair[0], pair[1]), createErrorContent);
  }

  return createOkContent(component, data);
}

export function createOkContent(component: ComponentType, data: unknown): RouteContent {
  return { component, state: { status: 'ok', data } };
}

export function createErrorContent(error: unknown): RouteContent {
  return { state: error instanceof NotFoundError ? { status: 'notFound' } : { status: 'error', error } };
}
