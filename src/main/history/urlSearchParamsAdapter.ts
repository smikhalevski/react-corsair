import { Dict } from '../types';
import { SearchParamsAdapter } from './types';

/**
 * Parses URL search params using {@link !URLSearchParams}.
 */
export const urlSearchParamsAdapter: SearchParamsAdapter = {
  parse(search) {
    const urlSearchParams = new URLSearchParams(search);
    const params: Dict = {};

    for (const key of urlSearchParams.keys()) {
      const value = urlSearchParams.getAll(key);

      params[key] = value.length === 1 ? value[0] : value;
    }
    return params;
  },

  stringify(params) {
    const urlSearchParams = new URLSearchParams();

    for (const name in params) {
      const value = params[name];

      if (value !== null && typeof value === 'object' && Symbol.iterator in value) {
        for (const item of Array.isArray(value) ? value : Array.from(value)) {
          urlSearchParams.append(name, String(item));
        }
      } else {
        urlSearchParams.set(name, String(value));
      }
    }
    return urlSearchParams.toString();
  },
};
