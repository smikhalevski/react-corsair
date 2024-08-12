import { urlSearchParamsAdapter } from '../../main';
import { parseURL, toURL } from '../../main/history/utils';

describe('toURL', () => {
  test('returns a URL', () => {
    expect(toURL({ pathname: '/aaa', searchParams: {}, hash: '' }, urlSearchParamsAdapter)).toBe('/aaa');
    expect(toURL({ pathname: '/aaa', searchParams: {}, hash: '#$%' }, urlSearchParamsAdapter)).toBe('/aaa#%23%24%25');
    expect(toURL({ pathname: '/aaa', searchParams: { xxx: 111, yyy: 222 }, hash: '' }, urlSearchParamsAdapter)).toBe(
      '/aaa?xxx=111&yyy=222'
    );
    expect(
      toURL({ pathname: '/aaa', searchParams: { xxx: 111, yyy: 222 }, hash: '' }, urlSearchParamsAdapter, 'http://zzz')
    ).toBe('http://zzz/aaa?xxx=111&yyy=222');
  });
});

describe('parseURL', () => {
  test('parses a URL', () => {
    expect(parseURL('/aaa', urlSearchParamsAdapter)).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(parseURL('/aaa#', urlSearchParamsAdapter)).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(parseURL('/aaa?', urlSearchParamsAdapter)).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(parseURL('/aaa?#', urlSearchParamsAdapter)).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });

    expect(parseURL('/aaa?xxx=111', urlSearchParamsAdapter)).toEqual({
      pathname: '/aaa',
      searchParams: { xxx: '111' },
      hash: '',
    });

    expect(parseURL('/aaa#%23%24%25', urlSearchParamsAdapter)).toEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '#$%',
    });
  });
});
