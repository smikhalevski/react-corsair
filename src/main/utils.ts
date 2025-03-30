import { Location, To } from './types';
import { Route } from './Route';
import { RoutePresenter } from './RoutePresenter';

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return value !== null && typeof value === 'object' && 'then' in value;
}

export function toLocation(to: To): Location {
  const { pathname = '/', searchParams = {}, hash = '', state } = 'getLocation' in to ? to.getLocation() : to;

  return { pathname, searchParams, hash, state };
}

export function noop() {}
