import { Dict } from './types';

export interface PathnameMatch {
  /**
   * A pathname that was matched.
   */
  pathname: string;

  /**
   * A pathname that should be matched by a nested route.
   */
  nestedPathname: string;

  /**
   * Params extracted from the pathname, or `undefined` if pathname doesn't have params.
   */
  params: Dict | undefined;
}

/**
 * Parses a pathname pattern, matches a pathname against this pattern, and creates a pathname from params and a pattern.
 */
export class PathnameAdapter {
  /**
   * Names of template params.
   */
  readonly paramNames: ReadonlySet<string>;

  /**
   * An array with an odd number of strings, where even items are param names.
   */
  protected _template;

  /**
   * The {@link !RegExp} that matches the template at the start of the pathname.
   */
  protected _regExp;

  /**
   * Creates a new {@link PathnameAdapter} instance.
   *
   * Pattern can include params that conform `\$[_A-Za-z][_A-Za-z0-9]+`. For example: "$userId".
   *
   * By default, params match a non-empty pathname substring not-including "/". Follow a param with a "*" to make param
   * match any character. For example: "$slug*".
   *
   * By default, params expect at least one character to be matched. To make param optional (so it can match zero
   * characters) follow it by a "?". For example: "$userId?" or "$slug*?".
   *
   * To use "$" as a character in a pathname pattern, replace it with an {@link !encodeURIComponent encoded}
   * representation: "%24".
   *
   * @param pathname A pathname pattern.
   */
  constructor(pathname: string) {
    const template = [];
    const paramNames = new Set<string>();

    let i = 0;
    let j = 0;
    let charCode;

    if (pathname.charAt(0) === '/') {
      pathname = pathname.substring(1);
    }
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    let segment;
    let pattern = '';

    while ((i = pathname.indexOf('$', i)) !== -1) {
      segment = pathname.substring(j, i);
      pattern += escapeRegExp(segment);
      template.push(segment);

      j = ++i;

      while (
        ((charCode = pathname.charCodeAt(i)),
        (i > j && charCode >= 48 && charCode <= 57) /* 0-9 */ ||
          (charCode >= 65 && charCode <= 90) /* A-Z */ ||
          (charCode >= 97 && charCode <= 122) /* a-z */ ||
          charCode === 95) /* _ */
      ) {
        ++i;
      }

      if (i === j) {
        throw new Error('Pathname param must have a name: ' + i);
      }

      segment = pathname.substring(j, i);

      if (charCode === 42 /* * */) {
        pattern += (charCode = pathname.charCodeAt(++i)) === 63 /* ? */ ? (++i, '(.*)') : '(.+)';
      } else {
        pattern += charCode === 63 /* ? */ ? (++i, '([^\\\\/]*)') : '([^\\\\/]+)';
      }

      paramNames.add(segment);
      template.push(segment);

      j = i;
    }

    if (j === 0) {
      template.push(pathname);
      pattern = escapeRegExp(pathname);
    } else {
      segment = pathname.substring(j);
      pattern += escapeRegExp(segment);
      template.push(segment);
    }

    this.paramNames = paramNames;

    this._template = template;
    this._regExp = pattern === '' ? /^/ : new RegExp('^\\/?' + pattern + '(?=\\/|$)', 'i');
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
      nestedPathname: pathname.length > m.length + 1 ? pathname.substring(m.length) : '',
      params,
    };
  }

  /**
   * Creates a pathname from a template by substituting params.
   *
   * The returned pathname never contains leading or trailing "/".
   */
  toPathname(params: Dict | undefined): string {
    const { _template } = this;

    if (_template.length !== 1 && params === undefined) {
      throw new Error('Pathname params are required: ' + Array.from(this.paramNames).join(', '));
    }

    let pathname = _template[0];

    for (let i = 1, paramValue; i < _template.length; i += 2) {
      paramValue = params![_template[i]];

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
