import { SearchParamsAdapter } from './types';
import { Dict } from '../types';

/**
 * An adapter that uses {@link !URLSearchParams} to serialize query and uses {@link JSON} to serialize param values.
 *
 * @group History
 */
export const jsonSearchParamsAdapter: SearchParamsAdapter = {
  parse(search) {
    const searchParams = new URLSearchParams(search);
    const params: Dict = {};

    if (searchParams.size === 0) {
      return params;
    }

    for (const key of new Set(searchParams.keys())) {
      const json = searchParams.get(key)!;

      try {
        params[key] = JSON.parse(json);
      } catch {
        params[key] = json;
      }
    }

    return params;
  },

  stringify(params) {
    const searchParams = new URLSearchParams();

    for (const key in params) {
      const value = params[key];
      const json = JSON.stringify(value);

      if (json === undefined) {
        continue;
      }

      if (
        json.charCodeAt(0) === 34 &&
        json !== '"true"' &&
        json !== '"false"' &&
        json !== '"null"' &&
        json.slice(1, -1) === value
      ) {
        searchParams.append(key, value);
      } else {
        searchParams.append(key, json);
      }
    }

    return searchParams.toString();
  },
};
