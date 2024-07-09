import { createPathnameRegExp, parsePathname, PathnameAdapter } from '../main/PathnameAdapter';

describe('parsePathname', () => {
  const FLAG_PARAM = 1;
  const FLAG_WILDCARD = 1 << 1;
  const FLAG_OPTIONAL = 1 << 2;

  test('parses pathname as a template', () => {
    expect(parsePathname('')).toEqual({ parts: [''], flags: [0] });
    expect(parsePathname('/')).toEqual({ parts: [''], flags: [0] });
    expect(parsePathname('//')).toEqual({ parts: ['', ''], flags: [0, 0] });
    expect(parsePathname('///')).toEqual({ parts: ['', '', ''], flags: [0, 0, 0] });
    expect(parsePathname('aaa')).toEqual({ parts: ['aaa'], flags: [0] });
    expect(parsePathname('/aaa')).toEqual({ parts: ['aaa'], flags: [0] });
    expect(parsePathname('/aaa/bbb')).toEqual({ parts: ['aaa', 'bbb'], flags: [0, 0] });
    expect(parsePathname('/aaa?')).toEqual({ parts: ['aaa'], flags: [FLAG_OPTIONAL] });
    expect(parsePathname('/aaa?/')).toEqual({ parts: ['aaa', ''], flags: [FLAG_OPTIONAL, 0] });
    expect(parsePathname('/aaa?/bbb?')).toEqual({ parts: ['aaa', 'bbb'], flags: [FLAG_OPTIONAL, FLAG_OPTIONAL] });
    expect(parsePathname(':xxx')).toEqual({ parts: ['xxx'], flags: [FLAG_PARAM] });
    expect(parsePathname('/:xxx')).toEqual({ parts: ['xxx'], flags: [FLAG_PARAM] });
    expect(parsePathname('/:xxx')).toEqual({ parts: ['xxx'], flags: [FLAG_PARAM] });
    expect(parsePathname('/:xxx?')).toEqual({ parts: ['xxx'], flags: [FLAG_PARAM | FLAG_OPTIONAL] });
    expect(parsePathname('/:xxx*')).toEqual({ parts: ['xxx'], flags: [FLAG_PARAM | FLAG_WILDCARD] });
    expect(parsePathname('/:xxx*?')).toEqual({
      parts: ['xxx'],
      flags: [FLAG_PARAM | FLAG_WILDCARD | FLAG_OPTIONAL],
    });
    expect(parsePathname('/:xxx*?/:yyy?')).toEqual({
      parts: ['xxx', 'yyy'],
      flags: [FLAG_PARAM | FLAG_WILDCARD | FLAG_OPTIONAL, FLAG_PARAM | FLAG_OPTIONAL],
    });
  });

  test('throws an error if syntax is invalid', () => {
    expect(() => parsePathname('aaa:xxx')).toThrow(new SyntaxError('Unexpected param at 3'));
    expect(() => parsePathname('/:/')).toThrow(new SyntaxError('Param must have a name at 2'));
    expect(() => parsePathname('/*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 1'));
    expect(() => parsePathname('/aaa*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 4'));
    expect(() => parsePathname('/aaa*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 4'));
    expect(() => parsePathname('/aaa??/')).toThrow(new SyntaxError('Unexpected optional flag at 5'));
    expect(() => parsePathname('/:xxx??/')).toThrow(new SyntaxError('Unexpected optional flag at 6'));
    expect(() => parsePathname('/:xxx?*/')).toThrow(new SyntaxError('Unexpected wildcard flag at 6'));
    expect(() => parsePathname('/:xxx**/')).toThrow(new SyntaxError('Unexpected wildcard flag at 6'));
    expect(() => parsePathname('/:xxxЯ/')).toThrow(new SyntaxError('Unexpected character at 5'));
    expect(() => parsePathname('/:xxx?xxx/')).toThrow(new SyntaxError('Unexpected character at 6'));
  });
});

describe('createPathnameRegExp', () => {
  test('creates a RegExp from a pathname template', () => {
    expect(createPathnameRegExp(parsePathname(''))).toEqual(/^\//i);
    expect(createPathnameRegExp(parsePathname('/'))).toEqual(/^\//i);
    expect(createPathnameRegExp(parsePathname('//'))).toEqual(/^\/\//i);
    expect(createPathnameRegExp(parsePathname('aaa'))).toEqual(/^\/aaa(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa?'))).toEqual(/^(?:\/aaa)?(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa?/bbb'))).toEqual(/^(?:\/aaa)?\/bbb(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa?/bbb?'))).toEqual(/^(?:\/aaa)?(?:\/bbb)?(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname(':xxx'))).toEqual(/^\/([^/]+)(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname(':xxx?'))).toEqual(/^(?:\/([^/]+))?(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname(':xxx*'))).toEqual(/^\/(.+)(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname(':xxx*?'))).toEqual(/^(?:\/(.+))?(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa/:xxx'))).toEqual(/^\/aaa\/([^/]+)(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa/:xxx?'))).toEqual(/^\/aaa(?:\/([^/]+))?(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa/:xxx*'))).toEqual(/^\/aaa\/(.+)(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa/:xxx*?'))).toEqual(/^\/aaa(?:\/(.+))?(?=\/|$)/i);
    expect(createPathnameRegExp(parsePathname('aaa/:xxx?/bbb'))).toEqual(/^\/aaa(?:\/([^/]+))?\/bbb(?=\/|$)/i);
  });
});

describe('PathnameAdapter', () => {
  test('matches a pathname without params', () => {
    expect(new PathnameAdapter('').match('/')).toEqual({ pathname: '/', nestedPathname: '/' });
    expect(new PathnameAdapter('').match('/aaa')).toEqual({ pathname: '/', nestedPathname: '/aaa' });
    expect(new PathnameAdapter('/aaa').match('/aaa')).toEqual({ pathname: '/aaa', nestedPathname: '/' });
    expect(new PathnameAdapter('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', nestedPathname: '/' });
    expect(new PathnameAdapter('/AAA').match('/aaa')).toEqual({ pathname: '/aaa', nestedPathname: '/' });
    expect(new PathnameAdapter('/aaa').match('/AAA')).toEqual({ pathname: '/AAA', nestedPathname: '/' });
    expect(new PathnameAdapter('/aaa').match('/aaa/bbb')).toEqual({ pathname: '/aaa', nestedPathname: '/bbb' });
    expect(new PathnameAdapter('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', nestedPathname: '/' });
  });

  test('does not match a pathname without params', () => {
    expect(new PathnameAdapter('').match('')).toBeNull();
    expect(new PathnameAdapter('/aaa').match('aaa')).toBeNull();
    expect(new PathnameAdapter('/aa').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aaaa').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aaabbb').match('/aaa')).toBeNull();
  });

  test('matches a pathname with params', () => {
    expect(new PathnameAdapter('/aaa/:xxx').match('/aaa/yyy')).toEqual({
      pathname: '/aaa/yyy',
      nestedPathname: '/',
      params: { xxx: 'yyy' },
    });

    expect(new PathnameAdapter('/aaa/:xxx*').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      nestedPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('creates a pathname without params', () => {
    expect(new PathnameAdapter('/aaa').toPathname(undefined)).toBe('/aaa');
  });

  test('creates a pathname with params', () => {
    expect(new PathnameAdapter('/aaa/:xxx').toPathname({ xxx: 'yyy' })).toBe('/aaa/yyy');
  });

  test("throws if non-optional param isn't provided", () => {
    expect(() => new PathnameAdapter('/:xxx').toPathname(undefined)).toThrow(new Error('Param must be a string: xxx'));

    expect(() => new PathnameAdapter('/:xxx').toPathname({})).toThrow(new Error('Param must be a string: xxx'));
  });

  test("does not throw if optional param isn't provided", () => {
    expect(new PathnameAdapter('/:xxx?').toPathname(undefined)).toBe('/');
    expect(new PathnameAdapter('/aaa/:xxx?').toPathname(undefined)).toBe('/aaa');
    expect(new PathnameAdapter('/aaa/:xxx?/bbb').toPathname(undefined)).toBe('/aaa/bbb');
  });

  test('matches a wildcard param', () => {
    expect(new PathnameAdapter('/aaa/:xxx*').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      nestedPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });

    expect(new PathnameAdapter('/aaa/:xxx*/ccc').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      nestedPathname: '/',
      params: { xxx: 'bbb' },
    });

    expect(new PathnameAdapter('/aaa/:xxx*/ddd').match('/aaa/bbb/ccc/ddd')).toEqual({
      pathname: '/aaa/bbb/ccc/ddd',
      nestedPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('matches an optional wildcard param', () => {
    expect(new PathnameAdapter('/aaa/:xxx*?').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      nestedPathname: '/',
      params: { xxx: 'bbb/ccc' },
    });
  });

  test('matches an optional param', () => {
    expect(new PathnameAdapter('/aaa/:xxx?').match('/aaa')).toEqual({
      pathname: '/aaa',
      nestedPathname: '/',
      params: { xxx: undefined },
    });

    expect(new PathnameAdapter('/aaa/:xxx?/ccc').match('/aaa/ccc')).toEqual({
      pathname: '/aaa/ccc',
      nestedPathname: '/',
      params: { xxx: undefined },
    });

    expect(new PathnameAdapter('/aaa/:xxx?/ccc').match('/aaa/bbb/ccc')).toEqual({
      pathname: '/aaa/bbb/ccc',
      nestedPathname: '/',
      params: { xxx: 'bbb' },
    });
  });
});
