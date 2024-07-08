import { ComponentType, createElement, isValidElement, memo, ReactElement, ReactNode } from 'react';
import { SearchParamsAdapter } from './createBrowserHistory';
import { Location, To } from './types';

const cache = new WeakMap<ComponentType | ReactElement, ReactNode>();

export function memoizeNode(value: ComponentType | ReactNode): ReactNode {
  if (typeof value !== 'function' && !isValidElement(value)) {
    return value;
  }
  let node = cache.get(value);

  if (node === undefined) {
    node = createElement(memo(typeof value !== 'function' ? () => value : value, propsAreEqual));
    cache.set(value, node);
  }
  return node;
}

// Memoized components don't receive any props, so props are always equal
function propsAreEqual(_prevProps: unknown, _nextProps: unknown): boolean {
  return true;
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return value !== null && typeof value === 'object' && 'then' in value;
}

export function isArrayEqual(a: any[], b: any[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function toLocation(to: To): Location {
  return 'getLocation' in to ? to.getLocation() : to;
}

export function toURL(location: Location, searchParamsAdapter: SearchParamsAdapter): string {
  let search = searchParamsAdapter.stringify(location.searchParams);

  search = search === '' || search === '?' ? '' : search.charAt(0) === '?' ? search : '?' + search;

  return location.pathname + search + location.hash;
}

export function parseURL(url: string, searchParamsAdapter: SearchParamsAdapter): Location {
  const { pathname, search, hash } = new URL(url, 'http://undefined');

  return {
    pathname,
    searchParams: searchParamsAdapter.parse(search),
    hash,
    state: undefined,
  };
}
