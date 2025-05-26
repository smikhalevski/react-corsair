import { describe, expect, test } from 'vitest';
import { createPatternRegExp, parsePattern, PathnameTemplate } from '../main/PathnameTemplate.js';

describe('parsePattern', () => {
  const FLAG_PARAM = 1;
  const FLAG_WILDCARD = 1 << 1;
  const FLAG_OPTIONAL = 1 << 2;

  test('parses pathname as a template', () => {
    expect(parsePattern('')).toStrictEqual({ segments: [''], flags: [0], paramNames: new Set() });
    expect(parsePattern('/')).toStrictEqual({ segments: [''], flags: [0], paramNames: new Set() });
    expect(parsePattern('//')).toStrictEqual({ segments: ['', ''], flags: [0, 0], paramNames: new Set() });
    expect(parsePattern('///')).toStrictEqual({ segments: ['', '', ''], flags: [0, 0, 0], paramNames: new Set() });
    expect(parsePattern('aaa')).toStrictEqual({ segments: ['aaa'], flags: [0], paramNames: new Set() });
    expect(parsePattern('/aaa')).toStrictEqual({ segments: ['aaa'], flags: [0], paramNames: new Set() });
    expect(parsePattern('/aaa/bbb')).toStrictEqual({ segments: ['aaa', 'bbb'], flags: [0, 0], paramNames: new Set() });
    expect(parsePattern('/aaa?')).toStrictEqual({ segments: ['aaa'], flags: [FLAG_OPTIONAL], paramNames: new Set() });
    expect(parsePattern('/aaa?/')).toStrictEqual({
      segments: ['aaa', ''],
      flags: [FLAG_OPTIONAL, 0],
      paramNames: new Set(),
    });
    expect(parsePattern('/aaa?/bbb?')).toStrictEqual({
      segments: ['aaa', 'bbb'],
      flags: [FLAG_OPTIONAL, FLAG_OPTIONAL],
      paramNames: new Set(),
    });
    expect(parsePattern(':xxx')).toStrictEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx')).toStrictEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx')).toStrictEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx?')).toStrictEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM | FLAG_OPTIONAL],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx*')).toStrictEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM | FLAG_WILDCARD],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx*?')).toStrictEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM | FLAG_WILDCARD | FLAG_OPTIONAL],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx*?/:yyy?')).toStrictEqual({
      segments: ['xxx', 'yyy'],
      flags: [FLAG_PARAM | FLAG_WILDCARD | FLAG_OPTIONAL, FLAG_PARAM | FLAG_OPTIONAL],
      paramNames: new Set(['xxx', 'yyy']),
    });
  });

  test('parses pathname with non-ASCII characters', () => {
    expect(new PathnameTemplate('/ффф')['_segments']).toStrictEqual(['ффф']);
  });

  test('throws an error if syntax is invalid', () => {
    expect(() => parsePattern('aaa:xxx')).toThrow(new SyntaxError('Unexpected param at 3'));
    expect(() => parsePattern('/:/')).toThrow(new SyntaxError('Param must have a name at 2'));
    expect(() => parsePattern('/*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 1'));
    expect(() => parsePattern('/aaa*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 4'));
    expect(() => parsePattern('/aaa*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 4'));
    expect(() => parsePattern('/aaa??/')).toThrow(new SyntaxError('Unexpected optional flag at 5'));
    expect(() => parsePattern('/:xxx??/')).toThrow(new SyntaxError('Unexpected optional flag at 6'));
    expect(() => parsePattern('/:xxx?*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 6'));
    expect(() => parsePattern('/:xxx**/')).toThrow(new SyntaxError('Unexpected wildcard flag at 6'));
    expect(() => parsePattern('/:xxxЯ/')).toThrow(new SyntaxError('Unexpected character at 5'));
    expect(() => parsePattern('/:xxx?xxx/')).toThrow(new SyntaxError('Unexpected character at 6'));
  });
});

describe('createPatternRegExp', () => {
  test('creates a RegExp from a pathname template', () => {
    expect(createPatternRegExp(parsePattern(''))).toStrictEqual(/^\//i);
    expect(createPatternRegExp(parsePattern('/'))).toStrictEqual(/^\//i);
    expect(createPatternRegExp(parsePattern('//'))).toStrictEqual(/^\/\//i);
    expect(createPatternRegExp(parsePattern('aaa'))).toStrictEqual(/^\/aaa(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa?'))).toStrictEqual(/^(?:\/aaa)?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa?/bbb'))).toStrictEqual(/^(?:\/aaa)?\/bbb(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa?/bbb?'))).toStrictEqual(/^(?:\/aaa)?(?:\/bbb)?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx'))).toStrictEqual(/^\/([^/]+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx?'))).toStrictEqual(/^(?:\/([^/]+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx*'))).toStrictEqual(/^\/(.+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx*?'))).toStrictEqual(/^(?:\/(.+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx'))).toStrictEqual(/^\/aaa\/([^/]+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx?'))).toStrictEqual(/^\/aaa(?:\/([^/]+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx*'))).toStrictEqual(/^\/aaa\/(.+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx*?'))).toStrictEqual(/^\/aaa(?:\/(.+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx?/bbb'))).toStrictEqual(/^\/aaa(?:\/([^/]+))?\/bbb(?=\/|$)/i);
  });
});

describe('PathnameTemplate', () => {
  test('matches a pathname without params', () => {
    expect(new PathnameTemplate('').match('/')).toStrictEqual({ pathname: '/', childPathname: '/', params: {} });
    expect(new PathnameTemplate('').match('/aaa')).toStrictEqual({ pathname: '/', childPathname: '/aaa', params: {} });
    expect(new PathnameTemplate('/aaa').match('/aaa')).toStrictEqual({
      pathname: '/aaa',
      childPathname: '/',
      params: {},
    });
    expect(new PathnameTemplate('/aaa').match('/aaa/')).toStrictEqual({
      pathname: '/aaa',
      childPathname: '/',
      params: {},
    });
    expect(new PathnameTemplate('/AAA').match('/aaa')).toStrictEqual({
      pathname: '/aaa',
      childPathname: '/',
      params: {},
    });
    expect(new PathnameTemplate('/aaa').match('/AAA')).toStrictEqual({
      pathname: '/AAA',
      childPathname: '/',
      params: {},
    });
    expect(new PathnameTemplate('/aaa').match('/aaa/bbb')).toStrictEqual({
      pathname: '/aaa',
      childPathname: '/bbb',
      params: {},
    });
    expect(new PathnameTemplate('/aaa').match('/aaa/')).toStrictEqual({
      pathname: '/aaa',
      childPathname: '/',
      params: {},
    });
  });

  test('does not match a pathname without params', () => {
    expect(new PathnameTemplate('').match('')).toBeNull();
    expect(new PathnameTemplate('/aaa').match('aaa')).toBeNull();
    expect(new PathnameTemplate('/aa').match('/aaa')).toBeNull();
    expect(new PathnameTemplate('/aaaa').match('/aaa')).toBeNull();
    expect(new PathnameTemplate('/aaabbb').match('/aaa')).toBeNull();
  });

  test('matches a pathname with params', () => {
    expect(new PathnameTemplate('/aaa/:xxx').match('/aaa/yyy')).toStrictEqual({
      pathname: '/aaa/yyy',
      childPathname: '/',
      params: { xxx: 'yyy' },
    });

    expect(new PathnameTemplate('/aaa/:xxx*').match('/aaa/bbb/ccc')).toStrictEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('creates a pathname without params', () => {
    expect(new PathnameTemplate('/aaa').toPathname()).toBe('/aaa');
  });

  test('creates a pathname with params', () => {
    expect(new PathnameTemplate('/aaa/:xxx').toPathname({ xxx: 'yyy' })).toBe('/aaa/yyy');
  });

  test("throws if non-optional param isn't provided", () => {
    expect(() => new PathnameTemplate('/:xxx').toPathname()).toThrow(
      new Error('Param must be a non-empty string or a number: xxx')
    );

    expect(() => new PathnameTemplate('/:xxx').toPathname({})).toThrow(
      new Error('Param must be a non-empty string or a number: xxx')
    );
  });

  test("does not throw if optional param isn't provided", () => {
    expect(new PathnameTemplate('/:xxx?').toPathname()).toBe('/');
    expect(new PathnameTemplate('/aaa/:xxx?').toPathname()).toBe('/aaa');
    expect(new PathnameTemplate('/aaa/:xxx?/bbb').toPathname()).toBe('/aaa/bbb');
  });

  test('matches a wildcard param', () => {
    expect(new PathnameTemplate('/aaa/:xxx*').match('/aaa/bbb/ccc')).toStrictEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });

    expect(new PathnameTemplate('/aaa/:xxx*/ccc').match('/aaa/bbb/ccc')).toStrictEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb' },
    });

    expect(new PathnameTemplate('/aaa/:xxx*/ddd').match('/aaa/bbb/ccc/ddd')).toStrictEqual({
      pathname: '/aaa/bbb/ccc/ddd',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('matches an optional wildcard param', () => {
    expect(new PathnameTemplate('/aaa/:xxx*?').match('/aaa/bbb/ccc')).toStrictEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('matches an optional param', () => {
    expect(new PathnameTemplate('/aaa/:xxx?').match('/aaa')).toStrictEqual({
      pathname: '/aaa',
      childPathname: '/',
      params: { xxx: undefined },
    });

    expect(new PathnameTemplate('/aaa/:xxx?/ccc').match('/aaa/ccc')).toStrictEqual({
      pathname: '/aaa/ccc',
      childPathname: '/',
      params: { xxx: undefined },
    });

    expect(new PathnameTemplate('/aaa/:xxx?/ccc').match('/aaa/bbb/ccc')).toStrictEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb' },
    });
  });
});
