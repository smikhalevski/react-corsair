import { createPathnameMatcher } from '../main/Route';

describe('createPathnameMatcher', () => {
  test('matches without slashes', () => {
    const matcher = createPathnameMatcher('aaa');

    expect(matcher('bbb')).toBeNull();

    expect(matcher('aaa')).toStrictEqual({ pathname: 'aaa', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: 'aaa', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: 'aaa', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: 'aaa', params: {} });
  });

  test('matches with leading slash', () => {
    const matcher = createPathnameMatcher('/aaa');

    expect(matcher('aaa')).toStrictEqual({ pathname: '/aaa', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: '/aaa', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: '/aaa', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: '/aaa', params: {} });
  });

  test('matches with trailing slash', () => {
    const matcher = createPathnameMatcher('aaa/');

    expect(matcher('aaa')).toStrictEqual({ pathname: 'aaa/', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: 'aaa/', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: 'aaa/', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: 'aaa/', params: {} });
  });

  test('matches with slashes', () => {
    const matcher = createPathnameMatcher('/aaa/');

    expect(matcher('aaa')).toStrictEqual({ pathname: '/aaa/', params: {} });
    expect(matcher('/aaa')).toStrictEqual({ pathname: '/aaa/', params: {} });
    expect(matcher('aaa/')).toStrictEqual({ pathname: '/aaa/', params: {} });
    expect(matcher('/aaa/')).toStrictEqual({ pathname: '/aaa/', params: {} });
  });

  test('matches with params', () => {
    const matcher = createPathnameMatcher('/:aaa/:bbb');

    expect(matcher('xxx/yyy')).toStrictEqual({ pathname: '/xxx/yyy', params: { aaa: 'xxx', bbb: 'yyy' } });
  });

  test('matches with wildcard', () => {
    const matcher = createPathnameMatcher('/aaa/*/bbb');

    expect(matcher('aaa/xxx/bbb')).toStrictEqual({ pathname: '/aaa/xxx/bbb', params: { 0: 'xxx' } });
  });

  test('matches with trailing wildcard', () => {
    const matcher = createPathnameMatcher('/aaa/*');

    expect(matcher('aaa/xxx/yyy/')).toStrictEqual({ pathname: '/aaa/', params: { 0: 'xxx/yyy' } });
  });

  test('matches with trailing wildcard with trailing slash', () => {
    const matcher = createPathnameMatcher('/aaa/*/');

    expect(matcher('aaa/xxx/yyy')).toStrictEqual({ pathname: '/aaa/xxx/yyy/', params: { 0: 'xxx/yyy' } });
  });
});
