import { describe, expect, test, vi } from 'vitest';
import {
  createHashLocationSerializer,
  createLocationSerializer,
  parseLocation,
  stringifyLocation,
} from '../../main/history/utils.js';
import { concatPathname, debasePathname, isUnloadBlocked, navigateOrBlock } from '../../main/history/utils.js';
import { Location } from '../../main/index.js';
import { HistoryTransaction, jsonSearchParamsSerializer } from '../../main/history/index.js';

describe('createLocationSerializer', () => {
  test('symmetrical without base pathname', () => {
    const serializer = createLocationSerializer();

    expect(serializer.stringify(serializer.parse(''))).toBe('/');
    expect(serializer.stringify(serializer.parse('/'))).toBe('/');
    expect(serializer.stringify(serializer.parse('?xxx=yyy'))).toBe('/?xxx=yyy');
    expect(serializer.stringify(serializer.parse('aaa'))).toBe('/aaa');
    expect(serializer.stringify(serializer.parse('/aaa?xxx=yyy#zzz'))).toBe('/aaa?xxx=yyy#zzz');
  });

  test('symmetrical with base pathname', () => {
    const serializer = createLocationSerializer({ basePathname: '/qqq/ppp' });

    expect(serializer.stringify(serializer.parse('/qqq/ppp/'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp//'))).toBe('/qqq/ppp//');
    expect(serializer.stringify(serializer.parse('/qqq/ppp'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/?xxx=yyy'))).toBe('/qqq/ppp/?xxx=yyy');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/aaa'))).toBe('/qqq/ppp/aaa');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/aaa?xxx=yyy#zzz'))).toBe('/qqq/ppp/aaa?xxx=yyy#zzz');
  });
});

describe('createHashLocationSerializer', () => {
  test('symmetrical without base pathname', () => {
    const serializer = createHashLocationSerializer();

    expect(serializer.stringify(serializer.parse(''))).toBe('');
    expect(serializer.stringify(serializer.parse('#'))).toBe('');
    expect(serializer.stringify(serializer.parse('#/'))).toBe('');
    expect(serializer.stringify(serializer.parse('#?xxx=yyy'))).toBe('#/?xxx=yyy');
    expect(serializer.stringify(serializer.parse('#aaa'))).toBe('#/aaa');
    expect(serializer.stringify(serializer.parse('#/aaa?xxx=yyy#zzz'))).toBe('#/aaa?xxx=yyy#zzz');
  });

  test('symmetrical with base pathname', () => {
    const serializer = createHashLocationSerializer({ basePathname: '/qqq/ppp' });

    expect(serializer.stringify(serializer.parse('/qqq/ppp/'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp//'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp#'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp#/'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/#/'))).toBe('/qqq/ppp');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/#?xxx=yyy'))).toBe('/qqq/ppp#/?xxx=yyy');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/#aaa'))).toBe('/qqq/ppp#/aaa');
    expect(serializer.stringify(serializer.parse('/qqq/ppp/#aaa?xxx=yyy#zzz'))).toBe('/qqq/ppp#/aaa?xxx=yyy#zzz');
  });
});

describe('stringifyLocation', () => {
  test('returns a URL', () => {
    expect(
      stringifyLocation({ pathname: '', searchParams: {}, hash: '', state: undefined }, jsonSearchParamsSerializer)
    ).toBe('/');

    expect(
      stringifyLocation({ pathname: 'aaa', searchParams: {}, hash: '', state: undefined }, jsonSearchParamsSerializer)
    ).toBe('/aaa');

    expect(
      stringifyLocation({ pathname: '/', searchParams: {}, hash: '', state: undefined }, jsonSearchParamsSerializer)
    ).toBe('/');

    expect(
      stringifyLocation({ pathname: '/aaa', searchParams: {}, hash: '', state: undefined }, jsonSearchParamsSerializer)
    ).toBe('/aaa');

    expect(
      stringifyLocation(
        { pathname: '/aaa', searchParams: {}, hash: '#$%', state: undefined },
        jsonSearchParamsSerializer
      )
    ).toBe('/aaa#%23%24%25');

    expect(
      stringifyLocation({ pathname: '', searchParams: {}, hash: 'aaa', state: undefined }, jsonSearchParamsSerializer)
    ).toBe('/#aaa');

    expect(
      stringifyLocation(
        { pathname: '', searchParams: { xxx: 111 }, hash: '', state: undefined },
        jsonSearchParamsSerializer
      )
    ).toBe('/?xxx=111');

    expect(
      stringifyLocation(
        { pathname: '/aaa', searchParams: { xxx: 111, yyy: 222 }, hash: '', state: undefined },
        jsonSearchParamsSerializer
      )
    ).toBe('/aaa?xxx=111&yyy=222');
  });
});

describe('parseLocation', () => {
  test('parses a URL', () => {
    expect(parseLocation('', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa#', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa?', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa#xxx?zzz', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: 'xxx?zzz',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa#xxx#zzz', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: 'xxx#zzz',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa?xxx#zzz', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: { xxx: '' },
      hash: 'zzz',
      state: undefined,
    } satisfies Location);
    expect(parseLocation('/aaa?#', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(parseLocation('/aaa?xxx=111', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(parseLocation('/aaa#zzz', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: 'zzz',
      state: undefined,
    } satisfies Location);

    expect(parseLocation('/aaa#%23%24%25', jsonSearchParamsSerializer)).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '#$%',
      state: undefined,
    } satisfies Location);
  });
});

describe('concatPathname', () => {
  test('concatenates URLs', () => {
    expect(concatPathname('', '')).toBe('');
    expect(concatPathname('', '/')).toBe('/');
    expect(concatPathname('', '#')).toBe('#');
    expect(concatPathname('', '?')).toBe('?');
    expect(concatPathname('/', '')).toBe('/');
    expect(concatPathname('/', '/')).toBe('/');
    expect(concatPathname('/', '#')).toBe('/#');
    expect(concatPathname('/', '?')).toBe('/?');
    expect(concatPathname('aaa', '')).toBe('aaa');
    expect(concatPathname('/aaa', '')).toBe('/aaa');
    expect(concatPathname('aaa', 'bbb')).toBe('aaa/bbb');
    expect(concatPathname('aaa', '?bbb')).toBe('aaa?bbb');
    expect(concatPathname('aaa', '#bbb')).toBe('aaa#bbb');
    expect(concatPathname('aaa', '?#bbb')).toBe('aaa?#bbb');
    expect(concatPathname('aaa', '/bbb')).toBe('aaa/bbb');
    expect(concatPathname('/aaa', '/bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/aaa', 'bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/aaa/', '/bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/aaa/', 'bbb')).toBe('/aaa/bbb');
    expect(concatPathname('/', 'aaa')).toBe('/aaa');
  });
});

describe('debasePathname', () => {
  test('removes base pathname', () => {
    expect(debasePathname('aaa', 'aaa')).toBe('');
    expect(debasePathname('aaa', 'aaa#bbb')).toBe('#bbb');
    expect(debasePathname('aaa', 'aaa?bbb')).toBe('?bbb');
    expect(debasePathname('aaa', 'aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/aaa', '/aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/aaa/', '/aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/aaa/', '/aaa/bbb')).toBe('/bbb');
    expect(debasePathname('/', '/aaa')).toBe('/aaa');
    expect(debasePathname('/aaa/', '/aaa')).toBe('');
    expect(debasePathname('/aaa/', '/aaa#')).toBe('#');
  });

  test('throws if URL does not match the base', () => {
    expect(() => debasePathname('/aaa', '/aaaaaa')).toThrow();
    expect(() => debasePathname('/aaa', '/aaa   ')).toThrow();
  });
});

describe('isUnloadBlocked', () => {
  const location = parseLocation('/aaa/bbb', jsonSearchParamsSerializer);

  test('calls blockers', () => {
    const blockerMock0 = vi.fn(() => false);
    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    expect(isUnloadBlocked(blockers, location)).toBe(false);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock0).toHaveBeenNthCalledWith(1, {
      type: 'unload',
      location,
      proceed: expect.any(Function),
      cancel: expect.any(Function),
    } satisfies HistoryTransaction);

    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenNthCalledWith(1, {
      type: 'unload',
      location,
      proceed: expect.any(Function),
      cancel: expect.any(Function),
    } satisfies HistoryTransaction);
  });

  test('returns true if blocker returns true', () => {
    const blockerMock0 = vi.fn(() => true);
    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    expect(isUnloadBlocked(blockers, location)).toBe(true);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).not.toHaveBeenCalled();
  });

  test('returns true if blocker called cancel', () => {
    const blockerMock0 = vi.fn(tx => tx.cancel());
    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    expect(isUnloadBlocked(blockers, location)).toBe(true);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).not.toHaveBeenCalled();
  });

  test('returns false if blocker called proceed', () => {
    const blockerMock0 = vi.fn(tx => tx.proceed());
    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    expect(isUnloadBlocked(blockers, location)).toBe(false);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenCalledTimes(1);
  });

  test('returns false if blocker called proceed and returned true', () => {
    const blockerMock0 = vi.fn(tx => {
      tx.proceed();
      return true;
    });

    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    expect(isUnloadBlocked(blockers, location)).toBe(false);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenCalledTimes(1);
  });

  test('returns true if blocker called cancel and returned false', () => {
    const blockerMock0 = vi.fn(tx => {
      tx.cancel();
      return false;
    });

    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    expect(isUnloadBlocked(blockers, location)).toBe(true);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).not.toHaveBeenCalled();
  });
});

describe('navigateOrBlock', () => {
  const location = parseLocation('/aaa/bbb', jsonSearchParamsSerializer);

  test('calls blockers', () => {
    const navigationMock = vi.fn();
    const blockerMock0 = vi.fn(() => false);
    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock('push', blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock0).toHaveBeenNthCalledWith(1, {
      type: 'push',
      location,
      proceed: expect.any(Function),
      cancel: expect.any(Function),
    } satisfies HistoryTransaction);
    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenNthCalledWith(1, {
      type: 'push',
      location,
      proceed: expect.any(Function),
      cancel: expect.any(Function),
    } satisfies HistoryTransaction);
    expect(navigationMock).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenNthCalledWith(1, location);
  });

  test('pauses execution until proceed is called', () => {
    const navigationMock = vi.fn();
    const blockerMock0 = vi.fn(_tx => true);
    const blockerMock1 = vi.fn(_tx => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock('push', blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock0).toHaveBeenNthCalledWith(1, {
      type: 'push',
      location,
      proceed: expect.any(Function),
      cancel: expect.any(Function),
    } satisfies HistoryTransaction);
    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).not.toHaveBeenCalled();

    blockerMock0.mock.calls[0][0].proceed();

    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenNthCalledWith(1, {
      type: 'push',
      location,
      proceed: expect.any(Function),
      cancel: expect.any(Function),
    } satisfies HistoryTransaction);
    expect(navigationMock).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenNthCalledWith(1, location);
  });

  test('proceed can be called from a blocker', () => {
    const navigationMock = vi.fn();
    const blockerMock0 = vi.fn(tx => {
      tx.proceed();
      return true;
    });
    const blockerMock1 = vi.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock('push', blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenCalledTimes(1);
  });

  test('calling proceed multiple times is a noop', () => {
    const navigationMock = vi.fn();
    const blockerMock0 = vi.fn(_tx => true);
    const blockerMock1 = vi.fn(_tx => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock('push', blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).not.toHaveBeenCalled();

    blockerMock0.mock.calls[0][0].proceed();
    blockerMock0.mock.calls[0][0].proceed();
    blockerMock0.mock.calls[0][0].proceed();

    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenCalledTimes(1);
  });

  test('cancels the navigation', () => {
    const navigationMock = vi.fn();
    const blockerMock = vi.fn(_tx => true);
    const blockers = new Set([blockerMock]);

    const cancel = navigateOrBlock('push', blockers, location, navigationMock);

    expect(blockerMock).toHaveBeenCalledTimes(1);
    expect(navigationMock).not.toHaveBeenCalled();

    cancel();

    blockerMock.mock.calls[0][0].proceed();

    expect(navigationMock).not.toHaveBeenCalled();
  });

  test('does not call a deleted blocker', () => {
    const navigationMock = vi.fn();
    const blockerMock0 = vi.fn(_tx => true);
    const blockerMock1 = vi.fn(_tx => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock('push', blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).not.toHaveBeenCalled();

    blockers.delete(blockerMock1);

    blockerMock0.mock.calls[0][0].proceed();

    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).toHaveBeenCalledTimes(1);
  });
});
