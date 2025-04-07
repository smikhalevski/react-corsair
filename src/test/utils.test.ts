import { toLocation } from '../main/utils';
import { Location } from '../main';

describe('toLocation', () => {
  test('returns a location', () => {
    expect(toLocation({})).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('preserves pathname', () => {
    expect(toLocation({ pathname: 'foo' })).toStrictEqual({
      pathname: 'foo',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('preserves params', () => {
    expect(toLocation({ searchParams: { aaa: 111 } })).toStrictEqual({
      pathname: '/',
      searchParams: { aaa: 111 },
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('preserves hash', () => {
    expect(toLocation({ hash: '#foo' })).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '#foo',
      state: undefined,
    } satisfies Location);
  });

  test('preserves state', () => {
    expect(toLocation({ state: 'aaa' })).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: 'aaa',
    } satisfies Location);
  });
});
