import { Location, To } from './types.js';
import { RouteController } from './RouteController.js';
import isDeepEqual from 'fast-deep-equal/es6/index.js';

export function noop() {}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return value !== null && typeof value === 'object' && 'then' in value;
}

export function toLocation(to: To): Location {
  const { pathname = '/', searchParams = {}, hash = '', state } = 'getLocation' in to ? to.getLocation() : to;

  return { pathname, searchParams, hash, state };
}

export function isEqualLocation(a: To | undefined, b: To | undefined): boolean {
  return a !== undefined && b !== undefined && isDeepEqual(toLocation(a), toLocation(b));
}

export function AbortError(message: string): Error {
  return typeof DOMException !== 'undefined' ? new DOMException(message, 'AbortError') : Error(message);
}

export function getDeepestController(controller: RouteController | null): RouteController | null {
  while (controller !== null && controller.childController !== null) {
    controller = controller.childController;
  }

  return controller;
}
