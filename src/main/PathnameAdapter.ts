import { Dict } from './types';

export interface PathnameMatch {
  /**
   * A pathname that was matched, beginning with a "/".
   */
  pathname: string;

  /**
   * A pathname that should be matched by a nested route, beginning with a "/".
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

  protected _parts;
  protected _flags;
  protected _regExp;

  /**
   * Creates a new {@link PathnameAdapter} instance.
   *
   * @param pathname A pathname pattern.
   * @param isCaseSensitive If `true` then pathname is matched in a case-sensitive manner.
   */
  constructor(pathname: string, isCaseSensitive = false) {
    const template = parsePathname(pathname);
    const paramNames = new Set<string>();

    for (let i = 0; i < template.parts.length; ++i) {
      if ((template.flags[i] & FLAG_PARAM) === FLAG_PARAM) {
        paramNames.add(template.parts[i]);
      }
    }

    this.paramNames = paramNames;

    this._parts = template.parts;
    this._flags = template.flags;
    this._regExp = createPathnameRegExp(template, isCaseSensitive);
  }

  /**
   * Matches a pathname against a pathname pattern.
   */
  match(pathname: string): PathnameMatch | null {
    const { _parts, _flags } = this;

    const match = this._regExp.exec(pathname);

    if (match === null) {
      return null;
    }

    let params: Dict | undefined;

    if (_parts.length !== 1) {
      params = {};

      for (let i = 0, j = 1, value; i < _parts.length; ++i) {
        if ((_flags[i] & FLAG_PARAM) !== FLAG_PARAM) {
          continue;
        }
        value = match[j++];
        params[_parts[i]] = value && decodeURIComponent(value);
      }
    }

    const m = match[0];
    const nestedPathname = pathname.substring(m.length);

    return {
      pathname: m === '' ? '/' : m,
      nestedPathname:
        nestedPathname.length === 0 || nestedPathname.charCodeAt(0) !== 47 ? '/' + nestedPathname : nestedPathname,
      params,
    };
  }

  /**
   * Creates a pathname from a template by substituting params, beginning with a "/".
   */
  toPathname(params: Dict | undefined): string {
    const { _parts, _flags } = this;

    let pathname = '';

    for (let i = 0, part, flag, value; i < _parts.length; i++) {
      part = _parts[i];
      flag = _flags[i];

      if ((flag & FLAG_PARAM) !== FLAG_PARAM) {
        pathname += '/' + part;
        continue;
      }
      if (
        (params === undefined || (value = params[part]) === undefined || value === null || value === '') &&
        (flag & FLAG_OPTIONAL) === FLAG_OPTIONAL
      ) {
        continue;
      }
      if (typeof value !== 'string') {
        throw new Error('Param must be a string: ' + part);
      }

      pathname +=
        '/' + ((flag & FLAG_WILDCARD) === FLAG_WILDCARD ? encodePathname(value) : encodePathnameComponent(value));
    }

    return pathname === '' ? '/' : pathname;
  }
}

const FLAG_PARAM = 1;
const FLAG_WILDCARD = 1 << 1;
const FLAG_OPTIONAL = 1 << 2;

const STAGE_SEPARATOR = 0;
const STAGE_SEGMENT = 1;
const STAGE_PARAM = 2;
const STAGE_WILDCARD = 3;
const STAGE_OPTIONAL = 4;

/**
 * A result of a pathname pattern parsing.
 */
interface Template {
  /**
   * A non-empty array of segments and param names extracted from a pathname pattern.
   */
  parts: string[];

  /**
   * An array of bitmasks that holds {@link parts} metadata.
   */
  flags: number[];
}

/**
 * Parses pathname pattern as a template.
 */
export function parsePathname(pathname: string): Template {
  const parts = [];
  const flags = [];

  let stage = STAGE_SEPARATOR;
  let segmentIndex = 0;

  for (let i = 0, charCode, paramIndex; i < pathname.length; ) {
    switch (pathname.charCodeAt(i)) {
      case 58 /* : */:
        if (stage !== STAGE_SEPARATOR) {
          throw new SyntaxError('Unexpected param at ' + i);
        }

        paramIndex = ++i;

        while (
          ((charCode = pathname.charCodeAt(i)),
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

        parts.push(pathname.substring(paramIndex, i));
        flags.push(FLAG_PARAM);
        stage = STAGE_PARAM;
        break;

      case 42 /* * */:
        if (stage !== STAGE_PARAM) {
          throw new SyntaxError('Unexpected wildcard flag at ' + i);
        }
        flags[flags.length - 1] |= FLAG_WILDCARD;
        stage = STAGE_WILDCARD;
        ++i;
        break;

      case 63 /* ? */:
        if (stage === STAGE_SEPARATOR || stage === STAGE_SEGMENT) {
          parts.push(pathname.substring(segmentIndex, i));
          flags.push(FLAG_OPTIONAL);
          stage = STAGE_OPTIONAL;
          ++i;
          break;
        }
        if (stage === STAGE_PARAM || stage === STAGE_WILDCARD) {
          flags[flags.length - 1] |= FLAG_OPTIONAL;
          stage = STAGE_OPTIONAL;
          ++i;
          break;
        }
        throw new SyntaxError('Unexpected optional flag at ' + i);

      case 47 /* / */:
        if (i !== 0 && (stage === STAGE_SEPARATOR || stage === STAGE_SEGMENT)) {
          parts.push(pathname.substring(segmentIndex, i));
          flags.push(0);
        }
        stage = STAGE_SEPARATOR;
        segmentIndex = ++i;
        break;

      default:
        if (stage !== STAGE_SEPARATOR && stage !== STAGE_SEGMENT) {
          throw new SyntaxError('Unexpected character at ' + i);
        }
        stage = STAGE_SEGMENT;
        ++i;
        break;
    }
  }

  if (stage === STAGE_SEPARATOR || stage === STAGE_SEGMENT) {
    parts.push(pathname.substring(segmentIndex));
    flags.push(0);
  }

  return { parts, flags };
}

/**
 * Creates a {@link !RegExp} that matches a pathname template.
 */
export function createPathnameRegExp(template: Template, isCaseSensitive = false): RegExp {
  const { parts, flags } = template;

  let pattern = '^';

  for (let i = 0, part, flag, segmentPattern; i < parts.length; ++i) {
    part = parts[i];
    flag = flags[i];

    if ((flag & FLAG_PARAM) !== FLAG_PARAM) {
      segmentPattern = part.length === 0 ? '/' : '/' + escapeRegExp(part);

      pattern += (flag & FLAG_OPTIONAL) === FLAG_OPTIONAL ? '(?:' + segmentPattern + ')?' : segmentPattern;
      continue;
    }

    if ((flag & FLAG_WILDCARD) === FLAG_WILDCARD) {
      pattern += (flag & FLAG_OPTIONAL) === FLAG_OPTIONAL ? '(?:/(.+))?' : '/(.+)';
    } else {
      pattern += (flag & FLAG_OPTIONAL) === FLAG_OPTIONAL ? '(?:/([^/]+))?' : '/([^/]+)';
    }
  }

  return new RegExp(pattern.endsWith('/') ? pattern : pattern + '(?=/|$)', isCaseSensitive ? '' : 'i');
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
