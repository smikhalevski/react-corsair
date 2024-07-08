import { PathnameAdapter } from '../main/PathnameAdapter';

describe('PathnameAdapter', () => {
  test('creates a template without params', () => {
    expect(new PathnameAdapter('')['_template']).toEqual(['']);
    expect(new PathnameAdapter('/')['_template']).toEqual(['']);
    expect(new PathnameAdapter('aaa')['_template']).toEqual(['aaa']);
    expect(new PathnameAdapter('aaa/')['_template']).toEqual(['aaa']);
    expect(new PathnameAdapter('/aaa')['_template']).toEqual(['aaa']);
    expect(new PathnameAdapter('/aaa/')['_template']).toEqual(['aaa']);
    expect(new PathnameAdapter('/aaa/bbb')['_template']).toEqual(['aaa/bbb']);
  });

  test('creates a template with params', () => {
    expect(new PathnameAdapter('$aaa')['_template']).toEqual(['', 'aaa', '']);
    expect(new PathnameAdapter('$AAA')['_template']).toEqual(['', 'AAA', '']);
    expect(new PathnameAdapter('$aaa111')['_template']).toEqual(['', 'aaa111', '']);
    expect(new PathnameAdapter('/$aaa_bbb')['_template']).toEqual(['', 'aaa_bbb', '']);
    expect(new PathnameAdapter('/$aaa+bbb')['_template']).toEqual(['', 'aaa', '+bbb']);
    expect(new PathnameAdapter('/$aaa$bbb')['_template']).toEqual(['', 'aaa', '', 'bbb', '']);
    expect(new PathnameAdapter('/bbb$aaa/ccc')['_template']).toEqual(['bbb', 'aaa', '/ccc']);
    expect(new PathnameAdapter('/bbb$aaa*/ccc')['_template']).toEqual(['bbb', 'aaa', '/ccc']);
    expect(new PathnameAdapter('/bbb$aaa*?/ccc')['_template']).toEqual(['bbb', 'aaa', '/ccc']);
    expect(new PathnameAdapter('/bbb$aaa?/ccc')['_template']).toEqual(['bbb', 'aaa', '/ccc']);
  });

  test('throws if param does not have a name', () => {
    expect(() => new PathnameAdapter('/aaa$111')).toThrow(new Error('Pathname param must have a name: 4'));
    expect(() => new PathnameAdapter('/$/')).toThrow();
    expect(() => new PathnameAdapter('/' + encodeURIComponent('$') + '')).not.toThrow();
  });

  test('matches a pathname without params', () => {
    expect(new PathnameAdapter('').match('')).toEqual({ pathname: '', nestedPathname: '' });
    expect(new PathnameAdapter('').match('/')).toEqual({ pathname: '', nestedPathname: '' });
    expect(new PathnameAdapter('').match('/aaa')).toEqual({ pathname: '', nestedPathname: '/aaa' });
    expect(new PathnameAdapter('/aaa').match('aaa')).toEqual({ pathname: 'aaa', nestedPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/aaa')).toEqual({ pathname: '/aaa', nestedPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', nestedPathname: '' });
    expect(new PathnameAdapter('/AAA').match('/aaa')).toEqual({ pathname: '/aaa', nestedPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/AAA')).toEqual({ pathname: '/AAA', nestedPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/aaa/bbb')).toEqual({ pathname: '/aaa', nestedPathname: '/bbb' });
    expect(new PathnameAdapter('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', nestedPathname: '' });
  });

  test('does not match a pathname without params', () => {
    expect(new PathnameAdapter('/aa').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aaaa').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aaabbb').match('/aaa')).toBeNull();
  });

  test('matches a pathname with params', () => {
    expect(new PathnameAdapter('/aaa$xxx').match('/aaayyy')).toEqual({
      pathname: '/aaayyy',
      nestedPathname: '',
      params: { xxx: 'yyy' },
    });

    expect(new PathnameAdapter('/aaa$xxx/bbb$yyy').match('/aaappp/bbbqqq/ccc')).toEqual({
      pathname: '/aaappp/bbbqqq',
      nestedPathname: '/ccc',
      params: { xxx: 'ppp', yyy: 'qqq' },
    });
  });

  test('creates a pathname without params', () => {
    expect(new PathnameAdapter('/aaa').toPathname({})).toBe('aaa');
  });

  test('creates a pathname with params', () => {
    expect(new PathnameAdapter('/aaa$xxx').toPathname({ xxx: 'yyy' })).toBe('aaayyy');
  });

  test('throws if params are not provided', () => {
    expect(() => new PathnameAdapter('/$xxx/$yyy').toPathname(undefined)).toThrow(
      new Error('Pathname params are required: xxx, yyy')
    );
  });

  test('matches a wildcard param', () => {
    expect(new PathnameAdapter('/aaa$xxx*').match('/aaa')).toBeNull();

    expect(new PathnameAdapter('/aaa$xxx*').match('/aaa/bbb/ccc')).toEqual({
      nestedPathname: '',
      params: { xxx: '/bbb/ccc' },
      pathname: '/aaa/bbb/ccc',
    });

    expect(new PathnameAdapter('/aaa$xxx*/ccc').match('/aaa/bbb/ccc')).toEqual({
      nestedPathname: '',
      params: { xxx: '/bbb' },
      pathname: '/aaa/bbb/ccc',
    });
  });

  test('matches an optional wildcard param', () => {
    expect(new PathnameAdapter('/aaa$xxx*?').match('/aaa')).toEqual({
      nestedPathname: '',
      params: { xxx: '' },
      pathname: '/aaa',
    });

    expect(new PathnameAdapter('/aaa$xxx*?').match('/aaa/bbb/ccc')).toEqual({
      nestedPathname: '',
      params: { xxx: '/bbb/ccc' },
      pathname: '/aaa/bbb/ccc',
    });
  });

  test('matches an optional param', () => {
    expect(new PathnameAdapter('/aaa$xxx?').match('/aaa')).toEqual({
      nestedPathname: '',
      params: { xxx: '' },
      pathname: '/aaa',
    });

    expect(new PathnameAdapter('/aaa$xxx?').match('/aaa/')).toEqual({
      nestedPathname: '',
      params: { xxx: '' },
      pathname: '/aaa',
    });

    expect(new PathnameAdapter('/aaa$xxx?').match('/aaa/bbb')).toEqual({
      nestedPathname: '/bbb',
      params: { xxx: '' },
      pathname: '/aaa',
    });
  });
});
