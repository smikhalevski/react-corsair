import { SearchParamsAdapter } from './types';
import { Dict } from '../types';

/**
 * An adapter that uses {@link !URLSearchParams} to serialize query and uses {@link JSON} to serialize param values.
 *
 * @group History
 */
export class JSONSearchParamsAdapter implements SearchParamsAdapter {
  parse(search: string): Dict {
    const searchParams = new URLSearchParams(search);
    const params: Dict = {};

    for (const key of new Set(searchParams.keys())) {
      this._decode(params, key, searchParams.getAll(key));
    }

    return params;
  }

  stringify(params: Dict): string {
    const searchParams = new URLSearchParams();

    for (const key in params) {
      this._encode(searchParams, key, params[key]);
    }

    return searchParams.toString();
  }

  /**
   * Sets the encoded param {@link value} to {@link searchParams}.
   *
   * @param searchParams Search params to update.
   * @param key The param key.
   * @param value The param value.
   */
  protected _encode(searchParams: URLSearchParams, key: string, value: any): void {
    const json = JSON.stringify(value);

    if (json === undefined) {
      return;
    }

    if (
      typeof value === 'string' &&
      value !== 'true' &&
      value !== 'false' &&
      value !== 'null' &&
      json.slice(1, -1) === value
    ) {
      searchParams.append(key, value);
    } else {
      searchParams.append(key, json);
    }
  }

  /**
   * Sets the decoded param {@link values} to {@link param}.
   *
   * @param params Decoded params to update.
   * @param key The param key.
   * @param values The array of values that were stringified under {@link key} in search params.
   */
  protected _decode(params: Dict, key: string, values: string[]): void {
    if (values.length !== 1) {
      params[key] = values;
    }

    try {
      params[key] = JSON.parse(values[0]);
    } catch {
      params[key] = values[0];
    }
  }
}
