import { Serializer } from '../types.js';

/**
 * An adapter that serializes search param values with {@link JSON}.
 *
 * @group History
 */
export const jsonSearchParamsSerializer: Serializer<Record<string, any>> = {
  parse(search) {
    const params: Record<string, any> = {};

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

      params[decodeURIComponent(search.substring(i, valueIndex))] = decodeJSON(
        decodeURIComponent(search.substring(valueIndex + 1, entryIndex))
      );
    }

    return params;
  },

  stringify(params) {
    let search = '';
    let paramIndex = 0;

    for (const key in params) {
      const value = params[key];

      if (value === undefined) {
        continue;
      }

      search +=
        (paramIndex++ === 0 ? '' : '&') + encodeSearchComponent(key) + '=' + encodeSearchComponent(encodeJSON(value));
    }

    return search;
  },
};

function encodeSearchComponent(str: string): string {
  return str.replace(/[#%=&\s]/g, encodeURIComponent);
}

function decodeJSON(str: string): any {
  const charCode = str.charCodeAt(0);

  if (
    str === 'null' ||
    str === 'true' ||
    str === 'false' ||
    charCode === /* { */ 123 ||
    charCode === /* [ */ 91 ||
    charCode === /* " */ 34 ||
    (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57)
  ) {
    try {
      return JSON.parse(str);
    } catch {}
  }

  return str;
}

function encodeJSON(value: any): string {
  const json = JSON.stringify(value);

  if (
    json.charCodeAt(0) !== /* " */ 34 ||
    json === '"null"' ||
    json === '"true"' ||
    json === '"false"' ||
    json.slice(1, -1) !== value
  ) {
    return json;
  }

  return value;
}
