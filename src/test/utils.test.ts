import { describe, expect, test } from 'vitest';
import { isEqualLocation, toLocation } from '../main/utils.js';
import { Location, To } from '../main/index.js';

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

describe('isEqualLocation', () => {
  test('returns true if locations are equal', () => {
    expect(isEqualLocation(undefined, undefined)).toBe(false);
    expect(isEqualLocation(undefined, {})).toBe(false);
    expect(isEqualLocation({}, undefined)).toBe(false);
    expect(isEqualLocation({}, {})).toBe(true);
    expect(isEqualLocation({ pathname: '/' }, {})).toBe(true);
    expect(isEqualLocation({ pathname: '/' }, { pathname: '/' })).toBe(true);
    expect(isEqualLocation({ pathname: '/aaa' }, { pathname: '/bbb' })).toBe(false);
    expect(isEqualLocation({ searchParams: {} }, {})).toBe(true);
    expect(isEqualLocation({ searchParams: { aaa: 111 } }, { searchParams: { aaa: 111 } })).toBe(true);
    expect(isEqualLocation({ state: {} }, {})).toBe(false);
    expect(isEqualLocation({ state: { aaa: 111 } }, { state: { aaa: 111 } })).toBe(true);
  });

  test('returns true if location providers are equal', () => {
    const location: Location = { pathname: '', searchParams: {}, hash: '', state: undefined };
    const to: To = { getLocation: () => location };

    expect(isEqualLocation(to, to)).toBe(true);
    expect(isEqualLocation(to, { getLocation: () => location })).toBe(true);
    expect(isEqualLocation(to, { getLocation: () => ({ ...location, pathname: '/aaa' }) })).toBe(false);
  });
});
