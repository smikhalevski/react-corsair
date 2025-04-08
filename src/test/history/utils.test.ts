import { parseLocation, stringifyLocation } from '../../main/history';
import { concatPathname, debasePathname, navigateOrBlock } from '../../main/history/utils';
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

describe('navigateOrBlock', () => {
  const location = parseLocation('/aaa/bbb');

  test('calls blockers', () => {
    const navigationMock = jest.fn();
    const blockerMock0 = jest.fn(() => false);
    const blockerMock1 = jest.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock(blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock0).toHaveBeenNthCalledWith(1, { location, proceed: expect.any(Function) });
    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenNthCalledWith(1, { location, proceed: expect.any(Function) });
    expect(navigationMock).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenNthCalledWith(1, location);
  });

  test('pauses execution until proceed is called', () => {
    const navigationMock = jest.fn();
    const blockerMock0 = jest.fn(tx => true);
    const blockerMock1 = jest.fn(tx => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock(blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock0).toHaveBeenNthCalledWith(1, { location, proceed: expect.any(Function) });
    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).not.toHaveBeenCalled();

    blockerMock0.mock.calls[0][0].proceed();

    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenNthCalledWith(1, { location, proceed: expect.any(Function) });
    expect(navigationMock).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenNthCalledWith(1, location);
  });

  test('proceed can be called from a blocker', () => {
    const navigationMock = jest.fn();
    const blockerMock0 = jest.fn(tx => {
      tx.proceed();
      return true;
    });
    const blockerMock1 = jest.fn(() => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock(blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).toHaveBeenCalledTimes(1);
    expect(navigationMock).toHaveBeenCalledTimes(1);
  });

  test('calling proceed multiple times is a noop', () => {
    const navigationMock = jest.fn();
    const blockerMock0 = jest.fn(tx => true);
    const blockerMock1 = jest.fn(tx => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock(blockers, location, navigationMock);

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
    const navigationMock = jest.fn();
    const blockerMock = jest.fn(tx => true);
    const blockers = new Set([blockerMock]);

    const cancel = navigateOrBlock(blockers, location, navigationMock);

    expect(blockerMock).toHaveBeenCalledTimes(1);
    expect(navigationMock).not.toHaveBeenCalled();

    cancel();

    blockerMock.mock.calls[0][0].proceed();

    expect(navigationMock).not.toHaveBeenCalled();
  });

  test('does not call a deleted blocker', () => {
    const navigationMock = jest.fn();
    const blockerMock0 = jest.fn(tx => true);
    const blockerMock1 = jest.fn(tx => false);
    const blockers = new Set([blockerMock0, blockerMock1]);

    navigateOrBlock(blockers, location, navigationMock);

    expect(blockerMock0).toHaveBeenCalledTimes(1);
    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).not.toHaveBeenCalled();

    blockers.delete(blockerMock1);

    blockerMock0.mock.calls[0][0].proceed();

    expect(blockerMock1).not.toHaveBeenCalled();
    expect(navigationMock).toHaveBeenCalledTimes(1);
  });
});
