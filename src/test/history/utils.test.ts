import { parseLocation, stringifyLocation } from '../../main/history/utils';

describe('toURL', () => {
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
    expect(parseLocation('/aaa')).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(parseLocation('/aaa#')).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(parseLocation('/aaa?')).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(parseLocation('/aaa?#')).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });

    expect(parseLocation('/aaa?xxx=111')).toEqual({
      pathname: '/aaa',
      searchParams: { xxx: '111' },
      hash: '',
    });

    expect(parseLocation('/aaa#%23%24%25')).toEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '#$%',
    });
  });
});
