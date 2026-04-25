import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Location, ParamsAdapter, ParamsAdapterLike, To } from './types.js';
import { RouteController } from './RouteController.js';
import { Redirect } from './Redirect.js';

export function noop(): void {}

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

export function isEqualError(a: unknown, b: unknown): boolean {
  return a === b || (a instanceof Redirect && b instanceof Redirect && isDeepEqual(a.to, b.to));
}

export function AbortError(message: string): Error {
  return typeof DOMException !== 'undefined' ? new DOMException(message, 'AbortError') : Error(message);
}

export function getLeafController(controller: RouteController | null): RouteController | null {
  while (controller !== null && controller.childController !== null) {
    controller = controller.childController;
  }

  return controller;
}

export function preventUnhandledRejection<T extends PromiseLike<any>>(promise: T): T {
  promise.then(noop, noop);
  return promise;
}

export function toParamsAdapter<Params extends Record<string, any>>(
  paramsAdapter: ParamsAdapterLike<Params>
): ParamsAdapter<Params> {
  if (typeof paramsAdapter === 'function') {
    return { fromRawParams: paramsAdapter };
  }

  if (!('~standard' in paramsAdapter)) {
    return paramsAdapter;
  }

  return {
    fromRawParams(searchParams, pathnameParams) {
      const result = paramsAdapter['~standard'].validate({ ...searchParams, ...pathnameParams });

      if (result instanceof Promise) {
        throw new Error('Params adapter must be synchronous');
      }

      return result.issues === undefined ? result.value : null;
    },
  };
}
