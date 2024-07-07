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
  });

  test('throws if param does not have a name', () => {
    expect(() => new PathnameAdapter('/$111aaa')).toThrow();
    expect(() => new PathnameAdapter('/$/')).toThrow();
    expect(() => new PathnameAdapter('/' + encodeURIComponent('$') + '')).not.toThrow();
  });

  test('matches a pathname without params', () => {
    expect(new PathnameAdapter('').match('')).toEqual({ pathname: '', nextPathname: '' });
    expect(new PathnameAdapter('').match('/')).toEqual({ pathname: '/', nextPathname: '' });
    expect(new PathnameAdapter('/aaa').match('aaa')).toEqual({ pathname: 'aaa', nextPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/aaa')).toEqual({ pathname: '/aaa', nextPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', nextPathname: '' });
    expect(new PathnameAdapter('/AAA').match('/aaa')).toEqual({ pathname: '/aaa', nextPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/AAA')).toEqual({ pathname: '/AAA', nextPathname: '' });
    expect(new PathnameAdapter('/aaa').match('/aaa/bbb')).toEqual({ pathname: '/aaa', nextPathname: '/bbb' });
    expect(new PathnameAdapter('/aaa').match('/aaa/')).toEqual({ pathname: '/aaa', nextPathname: '' });
  });

  test('does not match a pathname without params', () => {
    expect(new PathnameAdapter('/').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aa').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aaaa').match('/aaa')).toBeNull();
    expect(new PathnameAdapter('/aaabbb').match('/aaa')).toBeNull();
  });

  test('creates a pathname without params', () => {
    expect(new PathnameAdapter('/aaa').toPathname({})).toBe('aaa');
  });

  test('matches a pathname with params', () => {
    expect(new PathnameAdapter('/aaa$xxx').match('/aaayyy')).toEqual({
      pathname: '/aaayyy',
      nextPathname: '',
      params: { xxx: 'yyy' },
    });

    expect(new PathnameAdapter('/aaa$xxx/bbb$yyy').match('/aaappp/bbbqqq/ccc')).toEqual({
      pathname: '/aaappp/bbbqqq',
      nextPathname: '/ccc',
      params: { xxx: 'ppp', yyy: 'qqq' },
    });
  });

  test('creates a pathname with params', () => {
    expect(new PathnameAdapter('/aaa$xxx').toPathname({ xxx: 'yyy' })).toBe('aaayyy');
  });
});
