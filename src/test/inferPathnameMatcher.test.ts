import { inferPathnameMatcher } from '../main/inferPathnameMatcher';

describe('inferPathnameMatcher', () => {
  test('matches without slashes', () => {
    const matcher = inferPathnameMatcher('aaa');

    expect(matcher('bbb')).toBeUndefined();

    expect(matcher('aaa')).toStrictEqual({ pathname: 'aaa', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: 'aaa', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: 'aaa', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: 'aaa', params: {} });
  });

  test('matches with leading slash', () => {
    const matcher = inferPathnameMatcher('/aaa');

    expect(matcher('aaa')).toStrictEqual({ pathname: '/aaa', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: '/aaa', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: '/aaa', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: '/aaa', params: {} });
  });

  test('matches with trailing slash', () => {
    const matcher = inferPathnameMatcher('aaa/');

    expect(matcher('aaa')).toStrictEqual({ pathname: 'aaa/', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: 'aaa/', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: 'aaa/', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: 'aaa/', params: {} });
  });

  test('matches with slashes', () => {
    const matcher = inferPathnameMatcher('/aaa/');

    expect(matcher('aaa')).toStrictEqual({ pathname: '/aaa/', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: '/aaa/', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: '/aaa/', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: '/aaa/', params: {} });
  });

  test('matches with params', () => {
    const matcher = inferPathnameMatcher('/:aaa/:bbb');

    expect(matcher('xxx/yyy')).toStrictEqual({ pathname: '/xxx/yyy', params: { aaa: 'xxx', bbb: 'yyy' } });
  });

  test('matches with wildcard', () => {
    const matcher = inferPathnameMatcher('/aaa/*/bbb');

    expect(matcher('aaa/xxx/bbb')).toStrictEqual({ pathname: '/aaa/xxx/bbb', params: { 0: 'xxx' } });
  });

  test('matches with trailing wildcard', () => {
    const matcher = inferPathnameMatcher('/aaa/*');

    expect(matcher('aaa/xxx/yyy/')).toStrictEqual({ pathname: '/aaa/', params: { 0: 'xxx/yyy' } });
  });

  test('matches with trailing wildcard with trailing slash', () => {
    const matcher = inferPathnameMatcher('/aaa/*/');

    expect(matcher('aaa/xxx/yyy')).toStrictEqual({ pathname: '/aaa/xxx/yyy/', params: { 0: 'xxx/yyy' } });
  });
});
