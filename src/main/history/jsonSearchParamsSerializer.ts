import { SearchParamsSerializer } from './types';
import { Dict } from '../types';

/**
 * An adapter that serializes search param values with {@link JSON}.
 *
 * @group History
 */
export const jsonSearchParamsSerializer: SearchParamsSerializer = {
  parse(search) {
    const params: Dict = {};

    let valueIndex = 0;
    let entryIndex = 0;

    if (search.charAt(0) === '?') {
      entryIndex = 1;
    }

    for (let i = entryIndex; i < search.length; i = entryIndex + 1) {
      valueIndex = search.indexOf('=', i);
      entryIndex = search.indexOf('&', i);

      if (valueIndex === -1) {
        valueIndex = search.length;
      }
      if (entryIndex === -1) {
        entryIndex = search.length;
      }
      if (entryIndex < valueIndex) {
        valueIndex = entryIndex;
      }

      const key = decodeURIComponent(search.substring(i, valueIndex));
      const value = decodeURIComponent(search.substring(valueIndex + 1, entryIndex));

      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    }

    return params;
  },

  stringify(params) {
    let search = '';

    for (const key in params) {
      const value = params[key];
      const json = JSON.stringify(value);

      if (json === undefined) {
        continue;
      }

      if (search.length !== 0) {
        search += '&';
      }

      search += encodeSearchComponent(key) + '=';

      if (
        json.charCodeAt(0) === 34 &&
        json !== '"true"' &&
        json !== '"false"' &&
        json !== '"null"' &&
        json.slice(1, -1) === value
      ) {
        search += encodeSearchComponent(value);
      } else {
        search += encodeSearchComponent(json);
      }
    }

    return search;
  },
};

function encodeSearchComponent(str: string): string {
  return str.replace(/[#%=&\s]/g, encodeURIComponent);
}
