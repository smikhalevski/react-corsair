import { parseLocation, stringifyLocation } from '../../main/history';
import { concatPathname, debasePathname } from '../../main/history/utils';
import { Location } from '../../main';

describe('stringifyLocation', () => {
  test('returns a URL', () => {
    expect(stringifyLocation({ pathname: '/aaa', searchParams: {}, hash: '' })).toBe('/aaa');
    expect(stringifyLocation({ pathname: '/aaa', searchParams: {}, hash: '#$%' })).toBe('/aaa#%23%24%25');
    expect(stringifyLocation({ pathname: '/aaa', searchParams: { xxx: 111, yyy: 222 }, hash: '' })).toBe(
      '/aaa?xxx=111&yyy=222'
    );
  });
});

describe('parseLocation', () => {
  test('parses a URL', () => {
    expect(parseLocation('/aaa')).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa#')).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa?')).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa?#')).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(parseLocation('/aaa?xxx=111')).toStrictEqual({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(parseLocation('/aaa#%23%24%25')).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '#$%',
      state: undefined,
    } satisfies Location);
  });
});

describe('concatPathname', () => {
  test('prepends base pathname', () => {
    expect(concatPathname('aaa', '/bbb')).toBe('aaa/bbb');
    expect(concatPathname('/aaa', '/bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/aaa', 'bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/aaa/', '/bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/aaa/', 'bbb')).toBe('/aaa/bbb');
    expect(concatPathname('', 'aaa')).toBe('aaa');
    expect(concatPathname('', '/aaa')).toBe('/aaa');
    expect(concatPathname('/', 'aaa')).toBe('/aaa');
  });
});

describe('debasePathname', () => {
  test('removes base pathname', () => {
    expect(debasePathname('aaa', 'aaa')).toBe('/');
    expect(debasePathname('aaa', 'aaa#bbb')).toBe('/#bbb');
    expect(debasePathname('aaa', 'aaa?bbb')).toBe('/?bbb');
    expect(debasePathname('aaa', 'aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/aaa', '/aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/aaa/', '/aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/aaa/', '/aaa/bbb')).toBe('/bbb');
    expect(debasePathname('', 'aaa')).toBe('aaa');
    expect(debasePathname('', '/aaa')).toBe('/aaa');
    expect(debasePathname('/', '/aaa')).toBe('/aaa');
  });

  test('throws if cannot debase', () => {
    expect(() => debasePathname('/aaa', '/aaaaaa')).toThrow();
    expect(() => debasePathname('/aaa', '/aaa   ')).toThrow();
  });
});
