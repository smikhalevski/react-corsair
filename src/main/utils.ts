import { Location, To } from './types';
import { RouteController } from './RouteController';
import { Route } from './Route';
import isDeepEqual from 'fast-deep-equal';

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return value !== null && typeof value === 'object' && 'then' in value;
}

export function toLocation(to: To): Location {
  const { pathname = '/', searchParams = {}, hash = '', state } = 'getLocation' in to ? to.getLocation() : to;

  return { pathname, searchParams, hash, state };
}

export function noop() {}

export function AbortError(message: string): Error {
  return typeof DOMException !== 'undefined' ? new DOMException(message, 'AbortError') : Error(message);
}

export function isEqualLocation(a: To | undefined, b: To | undefined): boolean {
  return a instanceof Route && b instanceof Route ? a === b : isDeepEqual(a, b);
}

export function getTailController(controller: RouteController | null): RouteController | null {
  while (controller !== null && controller.childController !== null) {
    controller = controller.childController;
  }
  return controller;
}
