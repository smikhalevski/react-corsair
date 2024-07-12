import { Location } from '../types';
import { SearchParamsAdapter } from './types';

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
