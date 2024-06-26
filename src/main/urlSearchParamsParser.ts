import { RawParams, SearchParamsParser } from './types';

/**
 * Parses URL search params using {@link !URLSearchParams}.
 */
export const urlSearchParamsParser: SearchParamsParser = {
  parse(search) {
    const urlSearchParams = new URLSearchParams(search);
    const rawParams: RawParams = {};

    for (const key of urlSearchParams.keys()) {
      const value = urlSearchParams.getAll(key);

      rawParams[key] = value.length === 1 ? value[0] : value;
    }
    return rawParams;
  },

  stringify(rawParams) {
    const urlSearchParams = new URLSearchParams();

    for (const key in rawParams) {
      const value = rawParams[key];

      if (value !== null && typeof value === 'object' && Symbol.iterator in value) {
        for (const item of Array.isArray(value) ? value : Array.from(value)) {
          urlSearchParams.append(key, String(item));
        }
      } else {
        urlSearchParams.set(key, String(value));
      }
    }
    return urlSearchParams.toString();
  },
};
