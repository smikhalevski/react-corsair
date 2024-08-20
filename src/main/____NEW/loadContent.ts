import { ComponentType } from 'react';
import { RouteMatch } from './matchRoutes';
import { isPromiseLike } from './utils';

/**
 * Loadable value that is updated when a {@link !Promise} is fulfilled.
 */
export interface Payload<T> {
  value: Promise<T> | T;
}

export function createPayload<T>(value: Promise<T> | T): Payload<T> {
  const payload: Payload<T> = {
    value: isPromiseLike(value) ? value.then(value => (payload.value = value)) : value,
  };
  return payload;
}

export interface RouteState {
  status: 'ok' | 'error';
  data?: unknown;
  error?: unknown;
}

export interface RouteContent {
  component?: ComponentType;
  state: RouteState;
}

/**
 * Unconditionally loads route content.
 */
export function loadContent(routeMatch: RouteMatch, context: unknown): Payload<RouteContent> {
  let component;
  let data;

  try {
    component = routeMatch.route.getComponent();

    data = routeMatch.route.loader?.(routeMatch.params, context);
  } catch (error) {
    return createPayload(createErrorContent(error));
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return createPayload(
      Promise.all([component, data]).then(pair => createOkContent(pair[0], pair[1]), createErrorContent)
    );
  }

  return createPayload(createOkContent(component, data));
}

export function createOkContent(component: ComponentType, data: unknown): RouteContent {
  return { component, state: { status: 'ok', data } };
}

export function createErrorContent(error: unknown): RouteContent {
  return { state: { status: 'error', error } };
}
