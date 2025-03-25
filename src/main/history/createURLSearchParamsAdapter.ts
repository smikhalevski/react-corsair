import { Dict } from '../types';
import { SearchParamsAdapter } from './types';

/**
 * Parses URL search params using {@link !URLSearchParams}.
 *
 * @group History
 */
export const urlSearchParamsAdapter = createURLSearchParamsAdapter();

/**
 * Encodes/decodes search param names.
 *
 * @group History
 */
export interface NameEncoder {
  encode(name: string): string;

  decode(name: string): string;
}

/**
 * Options of {@link createURLSearchParamsAdapter}.
 *
 * @group History
 */
export interface URLSearchParamsAdapterOptions {
  /**
   * Converts search param names. By default, no encoding is done.
   */
  nameEncoder?: NameEncoder;

  /**
   * Encodes {@link Date} values during search string serialization.
   */
  dateEncoder?: (value: Date) => string;
}

/**
 * Creates a parser for URL search params that uses {@link !URLSearchParams} to serialize query params.
 *
 * @param options Search params options.
 * @group History
 */
export function createURLSearchParamsAdapter(options: URLSearchParamsAdapterOptions = {}): SearchParamsAdapter {
  const { nameEncoder } = options;

  return {
    parse(search) {
      const urlSearchParams = new URLSearchParams(search);
      const params: Dict = {};

      for (const name of urlSearchParams.keys()) {
        const value = urlSearchParams.getAll(name);
        const key = nameEncoder !== undefined ? nameEncoder.decode(name) : name;

        params[key] = value.length === 1 ? value[0] : value;
      }

      return params;
    },

    stringify(params) {
      const urlSearchParams = new URLSearchParams();

      for (const key in params) {
        const value = params[key];
        const name = nameEncoder !== undefined ? nameEncoder.encode(key) : key;

        if (value instanceof Set || Array.isArray(value)) {
          for (const item of value) {
            const paramValue = toParamValue(key, item, options);

            if (paramValue !== null) {
              urlSearchParams.append(name, paramValue);
            }
          }
          continue;
        }

        const paramValue = toParamValue(key, value, options);

        if (paramValue !== null) {
          urlSearchParams.append(name, paramValue);
        }
      }

      return urlSearchParams.toString();
    },
  };
}

function toParamValue(key: string, value: unknown, options: URLSearchParamsAdapterOptions): string | null {
  const { dateEncoder = toISOString } = options;

  if (value instanceof Date) {
    return dateEncoder(value);
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' || typeof value === 'symbol' || typeof value === 'function') {
    throw new TypeError(`Unsupported param value at "${key}"`);
  }
  return value.toString();
}

function toISOString(value: Date): string {
  return value.toISOString();
}
