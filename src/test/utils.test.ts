import { toLocation } from '../main/utils';

describe('toLocation', () => {
  test('returns a location', () => {
    expect(toLocation({})).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: undefined,
    });
  });

  test('preserves pathname', () => {
    expect(toLocation({ pathname: 'foo' })).toStrictEqual({
      pathname: 'foo',
      searchParams: {},
      hash: '',
      state: undefined,
    });
  });

  test('preserves params', () => {
    expect(toLocation({ searchParams: { aaa: 111 } })).toStrictEqual({
      pathname: '/',
      searchParams: { aaa: 111 },
      hash: '',
      state: undefined,
    });
  });

  test('preserves hash', () => {
    expect(toLocation({ hash: '#foo' })).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '#foo',
      state: undefined,
    });
  });

  test('preserves state', () => {
    expect(toLocation({ state: 'aaa' })).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: 'aaa',
    });
  });
});
