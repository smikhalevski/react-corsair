import { createPatternRegExp, parsePattern, PathnameTemplate } from '../main/PathnameTemplate';

describe('parsePattern', () => {
  const FLAG_PARAM = 1;
  const FLAG_WILDCARD = 1 << 1;
  const FLAG_OPTIONAL = 1 << 2;

  test('parses pathname as a template', () => {
    expect(parsePattern('')).toEqual({ segments: [''], flags: [0], paramNames: new Set() });
    expect(parsePattern('/')).toEqual({ segments: [''], flags: [0], paramNames: new Set() });
    expect(parsePattern('//')).toEqual({ segments: ['', ''], flags: [0, 0], paramNames: new Set() });
    expect(parsePattern('///')).toEqual({ segments: ['', '', ''], flags: [0, 0, 0], paramNames: new Set() });
    expect(parsePattern('aaa')).toEqual({ segments: ['aaa'], flags: [0], paramNames: new Set() });
    expect(parsePattern('/aaa')).toEqual({ segments: ['aaa'], flags: [0], paramNames: new Set() });
    expect(parsePattern('/aaa/bbb')).toEqual({ segments: ['aaa', 'bbb'], flags: [0, 0], paramNames: new Set() });
    expect(parsePattern('/aaa?')).toEqual({ segments: ['aaa'], flags: [FLAG_OPTIONAL], paramNames: new Set() });
    expect(parsePattern('/aaa?/')).toEqual({ segments: ['aaa', ''], flags: [FLAG_OPTIONAL, 0], paramNames: new Set() });
    expect(parsePattern('/aaa?/bbb?')).toEqual({
      segments: ['aaa', 'bbb'],
      flags: [FLAG_OPTIONAL, FLAG_OPTIONAL],
      paramNames: new Set(),
    });
    expect(parsePattern(':xxx')).toEqual({ segments: ['xxx'], flags: [FLAG_PARAM], paramNames: new Set(['xxx']) });
    expect(parsePattern('/:xxx')).toEqual({ segments: ['xxx'], flags: [FLAG_PARAM], paramNames: new Set(['xxx']) });
    expect(parsePattern('/:xxx')).toEqual({ segments: ['xxx'], flags: [FLAG_PARAM], paramNames: new Set(['xxx']) });
    expect(parsePattern('/:xxx?')).toEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM | FLAG_OPTIONAL],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx*')).toEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM | FLAG_WILDCARD],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx*?')).toEqual({
      segments: ['xxx'],
      flags: [FLAG_PARAM | FLAG_WILDCARD | FLAG_OPTIONAL],
      paramNames: new Set(['xxx']),
    });
    expect(parsePattern('/:xxx*?/:yyy?')).toEqual({
      segments: ['xxx', 'yyy'],
      flags: [FLAG_PARAM | FLAG_WILDCARD | FLAG_OPTIONAL, FLAG_PARAM | FLAG_OPTIONAL],
      paramNames: new Set(['xxx', 'yyy']),
    });
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
    expect(createPatternRegExp(parsePattern(''))).toEqual(/^\//i);
    expect(createPatternRegExp(parsePattern('/'))).toEqual(/^\//i);
    expect(createPatternRegExp(parsePattern('//'))).toEqual(/^\/\//i);
    expect(createPatternRegExp(parsePattern('aaa'))).toEqual(/^\/aaa(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa?'))).toEqual(/^(?:\/aaa)?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa?/bbb'))).toEqual(/^(?:\/aaa)?\/bbb(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa?/bbb?'))).toEqual(/^(?:\/aaa)?(?:\/bbb)?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx'))).toEqual(/^\/([^/]+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx?'))).toEqual(/^(?:\/([^/]+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx*'))).toEqual(/^\/(.+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern(':xxx*?'))).toEqual(/^(?:\/(.+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx'))).toEqual(/^\/aaa\/([^/]+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx?'))).toEqual(/^\/aaa(?:\/([^/]+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx*'))).toEqual(/^\/aaa\/(.+)(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx*?'))).toEqual(/^\/aaa(?:\/(.+))?(?=\/|$)/i);
    expect(createPatternRegExp(parsePattern('aaa/:xxx?/bbb'))).toEqual(/^\/aaa(?:\/([^/]+))?\/bbb(?=\/|$)/i);
  });
});

describe('PathnameTemplate', () => {
  test('matches a pathname without params', () => {
    expect(new PathnameTemplate('').match('/')).toEqual({ pathname: '/', childPathname: '/' });
    expect(new PathnameTemplate('').match('/aaa')).toEqual({ pathname: '/', childPathname: '/aaa' });
    expect(new PathnameTemplate('/aaa').match('/aaa')).toEqual({ pathname: '/aaa', childPathname: '/' });
    expect(new PathnameTemplate('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', childPathname: '/' });
    expect(new PathnameTemplate('/AAA').match('/aaa')).toEqual({ pathname: '/aaa', childPathname: '/' });
    expect(new PathnameTemplate('/aaa').match('/AAA')).toEqual({ pathname: '/AAA', childPathname: '/' });
    expect(new PathnameTemplate('/aaa').match('/aaa/bbb')).toEqual({ pathname: '/aaa', childPathname: '/bbb' });
    expect(new PathnameTemplate('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', childPathname: '/' });
  });

  test('does not match a pathname without params', () => {
    expect(new PathnameTemplate('').match('')).toBeNull();
    expect(new PathnameTemplate('/aaa').match('aaa')).toBeNull();
    expect(new PathnameTemplate('/aa').match('/aaa')).toBeNull();
    expect(new PathnameTemplate('/aaaa').match('/aaa')).toBeNull();
    expect(new PathnameTemplate('/aaabbb').match('/aaa')).toBeNull();
  });

  test('matches a pathname with params', () => {
    expect(new PathnameTemplate('/aaa/:xxx').match('/aaa/yyy')).toEqual({
      pathname: '/aaa/yyy',
      childPathname: '/',
      params: { xxx: 'yyy' },
    });

    expect(new PathnameTemplate('/aaa/:xxx*').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('creates a pathname without params', () => {
    expect(new PathnameTemplate('/aaa').toPathname(undefined)).toBe('/aaa');
  });

  test('creates a pathname with params', () => {
    expect(new PathnameTemplate('/aaa/:xxx').toPathname({ xxx: 'yyy' })).toBe('/aaa/yyy');
  });

  test("throws if non-optional param isn't provided", () => {
    expect(() => new PathnameTemplate('/:xxx').toPathname(undefined)).toThrow(new Error('Param must be a string: xxx'));

    expect(() => new PathnameTemplate('/:xxx').toPathname({})).toThrow(new Error('Param must be a string: xxx'));
  });

  test("does not throw if optional param isn't provided", () => {
    expect(new PathnameTemplate('/:xxx?').toPathname(undefined)).toBe('/');
    expect(new PathnameTemplate('/aaa/:xxx?').toPathname(undefined)).toBe('/aaa');
    expect(new PathnameTemplate('/aaa/:xxx?/bbb').toPathname(undefined)).toBe('/aaa/bbb');
  });

  test('matches a wildcard param', () => {
    expect(new PathnameTemplate('/aaa/:xxx*').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });

    expect(new PathnameTemplate('/aaa/:xxx*/ccc').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb' },
    });

    expect(new PathnameTemplate('/aaa/:xxx*/ddd').match('/aaa/bbb/ccc/ddd')).toEqual({
      pathname: '/aaa/bbb/ccc/ddd',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('matches an optional wildcard param', () => {
    expect(new PathnameTemplate('/aaa/:xxx*?').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('matches an optional param', () => {
    expect(new PathnameTemplate('/aaa/:xxx?').match('/aaa')).toEqual({
      pathname: '/aaa',
      childPathname: '/',
      params: { xxx: undefined },
    });

    expect(new PathnameTemplate('/aaa/:xxx?/ccc').match('/aaa/ccc')).toEqual({
      pathname: '/aaa/ccc',
      childPathname: '/',
      params: { xxx: undefined },
    });

    expect(new PathnameTemplate('/aaa/:xxx?/ccc').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      childPathname: '/',
      params: { xxx: 'bbb' },
    });
  });
});
