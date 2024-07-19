import { Location } from '../types';
import { SearchParamsAdapter } from './types';

export function toURL(location: Location, searchParamsAdapter: SearchParamsAdapter, base?: string | URL): string {
  const { pathname, searchParams, hash } = location;

  const search = searchParamsAdapter.stringify(searchParams);

  const url =
    pathname +
    (search === '' || search === '?' ? '' : search.charAt(0) === '?' ? search : '?' + search) +
    (hash === '' ? '' : '#' + encodeURIComponent(hash));

  return base === undefined ? url : new URL(url, base).toString();
}

export function parseURL(url: string, searchParamsAdapter: SearchParamsAdapter): Location {
  const { pathname, search, hash } = new URL(url, 'http://undefined');

  return {
    pathname,
    searchParams: searchParamsAdapter.parse(search),
    hash: decodeURIComponent(hash.substring(1)),
    state: undefined,
  };
}
