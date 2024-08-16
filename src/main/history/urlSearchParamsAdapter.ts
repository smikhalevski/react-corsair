import { Dict } from '../types';
import { SearchParamsAdapter } from './types';

/**
 * Parses URL search params using {@link !URLSearchParams}.
 *
 * @group History
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

      if (value instanceof Set || Array.isArray(value)) {
        for (const item of value) {
          appendParam(urlSearchParams, name, item);
        }
      } else {
        appendParam(urlSearchParams, name, value);
      }
    }
    return urlSearchParams.toString();
  },
};

function appendParam(urlSearchParams: URLSearchParams, name: string, value: unknown): void {
  const paramValue = toParamValue(name, value);

  if (paramValue !== null) {
    urlSearchParams.append(name, paramValue);
  }
}

function toParamValue(name: string, value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' || typeof value === 'symbol' || typeof value === 'function') {
    throw new TypeError('Unsupported param value type: ' + name);
  }
  return value.toString();
}
