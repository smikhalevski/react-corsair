import { Dict } from './__types';

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
  params: Dict | undefined;
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

    let params: Dict | undefined;

    if (_segments.length !== 1) {
      params = {};

      for (let i = 0, j = 1, value; i < _segments.length; ++i) {
        if ((_flags[i] & FLAG_PARAM) !== FLAG_PARAM) {
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

    for (let i = 0, segment, flag, value; i < _segments.length; i++) {
      segment = _segments[i];
      flag = _flags[i];

      if ((flag & FLAG_PARAM) !== FLAG_PARAM) {
        pathname += '/' + segment;
        continue;
      }

      if (
        (params === undefined || (value = params[segment]) === undefined || value === null || value === '') &&
        (flag & FLAG_OPTIONAL) === FLAG_OPTIONAL
      ) {
        continue;
      }

      if (Number.isFinite(value)) {
        value += '';
      }

      if (typeof value !== 'string' || value === '') {
        throw new Error('Param must be a non-empty string or a number: ' + segment);
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

  let stage = STAGE_SEPARATOR;
  let segmentIndex = 0;

  for (let i = 0, charCode, paramIndex, paramName; i < pattern.length; ) {
    switch (pattern.charCodeAt(i)) {
      case 58 /* : */:
        if (stage !== STAGE_SEPARATOR) {
          throw new SyntaxError('Unexpected param at ' + i);
        }

        paramIndex = ++i;

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

        paramName = pattern.substring(paramIndex, i);
        paramNames.add(paramName);
        segments.push(paramName);
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
          segments.push(pattern.substring(segmentIndex, i));
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
          segments.push(pattern.substring(segmentIndex, i));
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
    segments.push(pattern.substring(segmentIndex));
    flags.push(0);
  }

  return { segments, flags, paramNames };
}

/**
 * Creates a {@link !RegExp} that matches a pathname template.
 */
export function createPatternRegExp(template: Template, isCaseSensitive = false): RegExp {
  const { segments, flags } = template;

  let pattern = '^';

  for (let i = 0, segment, flag, segmentPattern; i < segments.length; ++i) {
    segment = segments[i];
    flag = flags[i];

    if ((flag & FLAG_PARAM) !== FLAG_PARAM) {
      segmentPattern = segment.length === 0 ? '/' : '/' + escapeRegExp(segment);

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
