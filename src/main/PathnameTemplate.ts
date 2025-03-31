import { Dict } from './types';

/**
 * A result returned by {@link PathnameTemplate.match} on a successful pathname match.
 *
 * @group Routing
 */
export interface PathnameMatch {
  /**
   * A pathname that was matched, beginning with a `/`.
   */
  pathname: string;

  /**
   * A pathname that should be matched by a child route, beginning with a `/`.
   */
  childPathname: string;

  /**
   * Params extracted from the pathname, or `undefined` if pathname doesn't have params.
   */
  params: Dict;
}

/**
 * A template of a pathname pattern.
 *
 * @group Routing
 */
export class PathnameTemplate {
  /**
   * Names of template params.
   */
  readonly paramNames: ReadonlySet<string>;

  /**
   * `true` if pathname is matched in a case-sensitive manner.
   */
  readonly isCaseSensitive: boolean;

  /**
   * An array that contains segments and param names.
   */
  protected _segments: string[];

  /**
   * An array of {@link _segments segment}-specific bitwise flags.
   */
  protected _flags: number[];

  /**
   * A regex that matches the pathname.
   */
  protected _regExp: RegExp;

  /**
   * Creates a new {@link PathnameTemplate} instance.
   *
   * @param pattern A pathname pattern from which a template is derived.
   * @param isCaseSensitive If `true` then pathname is matched in a case-sensitive manner.
   */
  constructor(
    readonly pattern: string,
    isCaseSensitive = false
  ) {
    const template = parsePattern(pattern);

    this.paramNames = template.paramNames;
    this.isCaseSensitive = isCaseSensitive;

    this._segments = template.segments;
    this._flags = template.flags;
    this._regExp = createPatternRegExp(template, isCaseSensitive);
  }

  /**
   * Matches a pathname against a pathname pattern.
   *
   * @param pathname A pathname to match.
   * @returns A matching result, or `null` if {@link pathname} doesn't match the template.
   */
  match(pathname: string): PathnameMatch | null {
    const { _segments, _flags } = this;

    const match = this._regExp.exec(pathname);

    if (match === null) {
      return null;
    }

    const params: Dict = {};

    if (_segments.length !== 1) {
      for (let i = 0, j = 1, value; i < _segments.length; ++i) {
        if (!contains(_flags[i], FLAG_PARAM)) {
          continue;
        }

        value = match[j++];
        params[_segments[i]] = value && decodeURIComponent(value);
      }
    }

    const m = match[0];
    const childPathname = pathname.substring(m.length);

    return {
      pathname: m === '' ? '/' : m,
      childPathname:
        childPathname.length === 0 || childPathname.charCodeAt(0) !== 47 ? '/' + childPathname : childPathname,
      params,
    };
  }

  /**
   * Creates a pathname (starts with a "/") from a template by substituting params.
   *
   * @param params Params to substitute into a template.
   * @returns A pathname string.
   */
  toPathname(params?: Dict | void): string {
    const { _segments, _flags } = this;

    let pathname = '';

    for (let i = 0, segment, flags, value; i < _segments.length; i++) {
      segment = _segments[i];
      flags = _flags[i];

      if (!contains(flags, FLAG_PARAM)) {
        pathname += '/' + segment;
        continue;
      }

      if (
        (params === undefined || (value = params[segment]) === undefined || value === null || value === '') &&
        contains(flags, FLAG_OPTIONAL)
      ) {
        continue;
      }

      if (isFinite(value)) {
        value += '';
      }

      if (typeof value !== 'string' || value === '') {
        throw new Error('Param must be a non-empty string or a number: ' + segment);
      }

      pathname += '/' + (contains(flags, FLAG_WILDCARD) ? encodePathname(value) : encodePathnameComponent(value));
    }

    return pathname === '' ? '/' : pathname;
  }

  /**
   * @hidden
   */
  toString(): string {
    return this.pattern;
  }
}

const FLAG_PARAM = 1;
const FLAG_WILDCARD = 1 << 1;
const FLAG_OPTIONAL = 1 << 2;

const TOKEN_SEPARATOR = 0;
const TOKEN_SEGMENT = 1;
const TOKEN_PARAM = 2;
const TOKEN_WILDCARD = 3;
const TOKEN_OPTIONAL = 4;

/**
 * A result of a pathname pattern parsing.
 */
export interface Template {
  /**
   * A non-empty array of segments and param names extracted from a pathname pattern.
   */
  segments: string[];

  /**
   * An array of bitmasks that holds {@link segments} metadata.
   */
  flags: number[];

  /**
   * Names of pattern params.
   */
  paramNames: ReadonlySet<string>;
}

/**
 * Parses pathname pattern as segments and flags.
 */
export function parsePattern(pattern: string): Template {
  const segments = [];
  const flags = [];
  const paramNames = new Set<string>();

  let tokenType = TOKEN_SEPARATOR;
  let segmentIndex = 0;

  for (let i = 0; i < pattern.length; ) {
    switch (pattern.charCodeAt(i)) {
      case 58 /* : */:
        if (tokenType !== TOKEN_SEPARATOR) {
          throw new SyntaxError('Unexpected param at ' + i);
        }

        let paramIndex = ++i;
        let charCode;

        while (
          ((charCode = pattern.charCodeAt(i)),
          (i > paramIndex && charCode >= 48 && charCode <= 57) /* 0-9 */ ||
            (charCode >= 65 && charCode <= 90) /* A-Z */ ||
            (charCode >= 97 && charCode <= 122) /* a-z */ ||
            charCode === 95 /* _ */ ||
            charCode === 36) /* $ */
        ) {
          ++i;
        }

        if (paramIndex === i) {
          throw new SyntaxError('Param must have a name at ' + i);
        }

        const paramName = pattern.substring(paramIndex, i);

        paramNames.add(paramName);
        segments.push(paramName);
        flags.push(FLAG_PARAM);
        tokenType = TOKEN_PARAM;
        break;

      case 42 /* * */:
        if (tokenType !== TOKEN_PARAM) {
          throw new SyntaxError('Unexpected wildcard flag at ' + i);
        }

        flags[flags.length - 1] |= FLAG_WILDCARD;
        tokenType = TOKEN_WILDCARD;
        ++i;
        break;

      case 63 /* ? */:
        if (tokenType === TOKEN_SEPARATOR || tokenType === TOKEN_SEGMENT) {
          segments.push(pattern.substring(segmentIndex, i));
          flags.push(FLAG_OPTIONAL);
          tokenType = TOKEN_OPTIONAL;
          ++i;
          break;
        }

        if (tokenType === TOKEN_PARAM || tokenType === TOKEN_WILDCARD) {
          flags[flags.length - 1] |= FLAG_OPTIONAL;
          tokenType = TOKEN_OPTIONAL;
          ++i;
          break;
        }

        throw new SyntaxError('Unexpected optional flag at ' + i);

      case 47 /* / */:
        if (i !== 0 && (tokenType === TOKEN_SEPARATOR || tokenType === TOKEN_SEGMENT)) {
          segments.push(pattern.substring(segmentIndex, i));
          flags.push(0);
        }

        tokenType = TOKEN_SEPARATOR;
        segmentIndex = ++i;
        break;

      default:
        if (tokenType !== TOKEN_SEPARATOR && tokenType !== TOKEN_SEGMENT) {
          throw new SyntaxError('Unexpected character at ' + i);
        }

        tokenType = TOKEN_SEGMENT;
        ++i;
        break;
    }
  }

  if (tokenType === TOKEN_SEPARATOR || tokenType === TOKEN_SEGMENT) {
    segments.push(pattern.substring(segmentIndex));
    flags.push(0);
  }

  return { segments, flags, paramNames };
}

/**
 * Creates a {@link !RegExp} that matches a pathname template.
 */
export function createPatternRegExp(template: Template, isCaseSensitive = false): RegExp {
  const { segments } = template;

  let pattern = '^';

  for (let i = 0; i < segments.length; ++i) {
    const segment = segments[i];
    const flags = template.flags[i];

    if (!contains(flags, FLAG_PARAM)) {
      const segmentPattern = segment.length === 0 ? '/' : '/' + escapeRegExp(segment);

      pattern += contains(flags, FLAG_OPTIONAL) ? '(?:' + segmentPattern + ')?' : segmentPattern;
      continue;
    }

    if (contains(flags, FLAG_WILDCARD)) {
      pattern += contains(flags, FLAG_OPTIONAL) ? '(?:/(.+))?' : '/(.+)';
    } else {
      pattern += contains(flags, FLAG_OPTIONAL) ? '(?:/([^/]+))?' : '/([^/]+)';
    }
  }

  return new RegExp(pattern.endsWith('/') ? pattern : pattern + '(?=/|$)', isCaseSensitive ? '' : 'i');
}

function contains(flags: number, flag: number): boolean {
  return (flags & flag) === flag;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function encodePathname(str: string): string {
  return str.replace(/[:*?]/g, encodeURIComponent);
}

function encodePathnameComponent(str: string): string {
  return str.replace(/[:*?/]/g, encodeURIComponent);
}
