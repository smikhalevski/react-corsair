import { Dict } from './types';

export interface PathnameMatch {
  /**
   * A pathname that was matched.
   */
  pathname: string;

  /**
   * A pathname that should be matched by a nested route.
   */
  nextPathname: string;

  /**
   * Params extracted from the pathname, or `undefined` if pathname doesn't have params.
   */
  params: Dict | undefined;
}

export class PathnameAdapter {
  /**
   * Names of template params.
   */
  paramNames = new Set<string>();

  /**
   * An array with an odd number of strings, where even items are param names.
   */
  protected _template;

  /**
   * The {@link !RegExp} that matches the template at the start of the pathname.
   */
  protected _regExp;

  constructor(pathname: string) {
    const template = [];

    let i = 0;
    let j = 0;
    let charCode;
    let paramName;

    if (pathname.charAt(0) === '/') {
      pathname = pathname.substring(1);
    }
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    while ((i = pathname.indexOf('$', i)) !== -1) {
      template.push(pathname.substring(j, i));

      j = ++i;

      while (
        ((charCode = pathname.charCodeAt(i)),
        (i > j && charCode >= 48 && charCode <= 57) || // 0-9
          (charCode >= 65 && charCode <= 90) || // A-Z
          (charCode >= 97 && charCode <= 122) || // a-z
          charCode === 95) // _
      ) {
        i++;
      }

      if (i === j) {
        throw new Error('Pathname param must have a name: ' + i);
      }

      paramName = pathname.substring(j, i);
      this.paramNames.add(paramName);
      template.push(paramName);

      j = i;
    }

    let pattern;

    if (j === 0) {
      template.push(pathname);
      pattern = escapeRegExp(pathname);
    } else {
      template.push(pathname.substring(j));
      pattern = escapeRegExp(template[0]);

      for (let i = 2; i < template.length; i += 2) {
        pattern += '([^\\/]+)' + escapeRegExp(template[i]);
      }
    }

    pattern = '^\\/?' + pattern + (pattern === '' ? '$' : '(?=\\/|$)');

    this._template = template;
    this._regExp = new RegExp(pattern, 'i');
  }

  /**
   * Matches a pathname against a template and returns a match if pathname conforms.
   */
  match(pathname: string): PathnameMatch | null {
    const { _template } = this;

    const match = this._regExp.exec(pathname);

    if (match === null) {
      return null;
    }

    let params: Dict | undefined;

    if (_template.length !== 1) {
      params = {};

      for (let i = 1; i < _template.length; i += 2) {
        params[_template[i]] = decodeURIComponent(match[(i + 1) >> 1]);
      }
    }

    const m = match[0];

    return {
      pathname: m,
      nextPathname: pathname.length > m.length + 1 ? pathname.substring(m.length) : '',
      params,
    };
  }

  /**
   * Creates a pathname from a template by substituting params.
   *
   * The returned pathname never contains leading or trailing "/".
   */
  toPathname(params: any): string {
    const { _template } = this;

    if (_template.length !== 1 && params === undefined) {
      throw new Error('Pathname params are required: ' + Array.from(this.paramNames).join(', '));
    }

    let pathname = _template[0];

    for (let i = 1, paramValue; i < _template.length; i += 2) {
      paramValue = params[_template[i]];

      if (typeof paramValue !== 'string') {
        throw new Error('Pathname param must be a string: ' + _template[i]);
      }

      pathname += encodeURIComponent(paramValue) + _template[i + 1];
    }

    return pathname;
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
