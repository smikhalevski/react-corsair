import { expect, test, vi } from 'vitest';
import { createMemoryHistory, HistoryTransaction } from '../..//main/history/index.js';
import { createRoute, Location } from '../../main/index.js';

test('throws if there is no initial entry', () => {
  expect(() => createMemoryHistory({ initialEntries: [] })).toThrow(new Error('Expected at least one initial entry'));
});

test('parses initial entries', () => {
  expect(createMemoryHistory({ initialEntries: ['/aaa?xxx=yyy'] }).location).toStrictEqual({
    pathname: '/aaa',
    searchParams: { xxx: 'yyy' },
    hash: '',
    state: undefined,
  } satisfies Location);

  expect(
    createMemoryHistory({
      initialEntries: ['/aaa?xxx=yyy'],
    }).location
  ).toStrictEqual({
    pathname: '/aaa',
    searchParams: { xxx: 'yyy' },
    hash: '',
    state: undefined,
  } satisfies Location);

  expect(createMemoryHistory({ initialEntries: [createRoute({ pathname: '/aaa' })] }).location).toStrictEqual({
    pathname: '/aaa',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('throws if base pathname is invalid', () => {
  expect(
    () =>
      createMemoryHistory({
        basePathname: '/bbb',
        initialEntries: ['/aaa?xxx=yyy'],
      }).location
  ).toThrow(new Error("Pathname doesn't match the required base: /bbb"));
});

test('pushes location', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const cccLocation: Location = { pathname: '/ccc', searchParams: {}, hash: '', state: undefined };

  const history = createMemoryHistory({ initialEntries: [aaaLocation] });

  expect(history.location).toStrictEqual(aaaLocation);

  history.push(bbbLocation);

  expect(history.location).toStrictEqual(bbbLocation);

  history.back();

  expect(history.location).toStrictEqual(aaaLocation);

  history.push(cccLocation);

  expect(history.location).toStrictEqual(cccLocation);

  history.back();

  expect(history.location).toStrictEqual(aaaLocation);
});

test('replaces location', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const cccLocation: Location = { pathname: '/ccc', searchParams: {}, hash: '', state: undefined };

  const history = createMemoryHistory({ initialEntries: [aaaLocation] });

  history.replace(bbbLocation);

  expect(history.location).toStrictEqual(bbbLocation);

  history.back();

  expect(history.location).toStrictEqual(bbbLocation);

  history.push(aaaLocation);

  expect(history.location).toStrictEqual(aaaLocation);

  history.replace(cccLocation);

  expect(history.location).toStrictEqual(cccLocation);

  history.back();

  expect(history.location).toStrictEqual(bbbLocation);
});

test('calls listener on push', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const listenerMock = vi.fn();

  const history = createMemoryHistory({ initialEntries: [aaaLocation] });

  history.subscribe(listenerMock);
  history.push(bbbLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on replace', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const listenerMock = vi.fn();

  const history = createMemoryHistory({ initialEntries: [aaaLocation] });

  history.subscribe(listenerMock);
  history.replace(bbbLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on back', () => {
  const listenerMock = vi.fn();

  const history = createMemoryHistory({
    initialEntries: [
      { pathname: '/aaa', searchParams: {}, hash: '' },
      { pathname: '/bbb', searchParams: {}, hash: '' },
      { pathname: '/ccc', searchParams: {}, hash: '' },
    ],
  });

  history.subscribe(listenerMock);
  history.back();
  history.back();
  history.back();

  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('creates an absolute URL', () => {
  expect(
    createMemoryHistory({ basePathname: '/bbb', initialEntries: [{}] }).toURL({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
    })
  ).toBe('/bbb/aaa?xxx=111');
});

test('creates an absolute URL with a base pathname', () => {
  expect(
    createMemoryHistory({
      initialEntries: [{}],
      basePathname: 'bbb',
    }).toURL({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
    })
  ).toBe('bbb/aaa?xxx=111');
});

test('does not block the navigation', () => {
  const blockerMock = vi.fn(_tx => false);

  const history = createMemoryHistory({ initialEntries: [{}] });

  history.block(blockerMock);

  history.push('/aaa?xxx=111');

  expect(blockerMock).toHaveBeenCalledTimes(1);
  expect(blockerMock.mock.calls[0][0]).toStrictEqual({
    type: 'push',
    location: {
      hash: '',
      pathname: '/aaa',
      searchParams: {
        xxx: 111,
      },
      state: undefined,
    },
    proceed: expect.any(Function),
    cancel: expect.any(Function),
  } satisfies HistoryTransaction);

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/aaa',
    searchParams: {
      xxx: 111,
    },
    state: undefined,
  } satisfies Location);
});

test('blocks the navigation', () => {
  const blockerMock = vi.fn(() => true);

  const history = createMemoryHistory({ initialEntries: [{}] });

  history.block(blockerMock);

  history.push('/aaa?xxx=111');

  expect(blockerMock).toHaveBeenCalledTimes(1);

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/',
    searchParams: {},
    state: undefined,
  } satisfies Location);
});

test('proceeds with the navigation after blocking', () => {
  const history = createMemoryHistory({ initialEntries: [{}] });

  let proceed;

  history.block(tx => {
    proceed = tx.proceed;
    return true;
  });

  history.push('/aaa?xxx=111');

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/',
    searchParams: {},
    state: undefined,
  } satisfies Location);

  proceed!();

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/aaa',
    searchParams: {
      xxx: 111,
    },
    state: undefined,
  } satisfies Location);
});

test('proceeds with the navigation during blocking', () => {
  const history = createMemoryHistory({ initialEntries: [{}] });

  history.block(tx => {
    tx.proceed();
    return true;
  });

  history.push('/aaa?xxx=111');

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/aaa',
    searchParams: {
      xxx: 111,
    },
    state: undefined,
  } satisfies Location);
});

test('calls all blockers', () => {
  const blockerMock1 = vi.fn(() => false);
  const blockerMock2 = vi.fn(() => false);

  const history = createMemoryHistory({ initialEntries: [{}] });

  history.block(blockerMock1);
  history.block(blockerMock2);

  history.push('/aaa?xxx=111');

  expect(blockerMock1).toHaveBeenCalledTimes(1);
  expect(blockerMock2).toHaveBeenCalledTimes(1);
});

test('does not call the next blocker if true is returned', () => {
  const blockerMock1 = vi.fn(() => true);
  const blockerMock2 = vi.fn();

  const history = createMemoryHistory({ initialEntries: [{}] });

  history.block(blockerMock1);
  history.block(blockerMock2);

  history.push('/aaa?xxx=111');

  expect(blockerMock1).toHaveBeenCalledTimes(1);
  expect(blockerMock2).not.toHaveBeenCalled();
});

test('unregisters a blocker', () => {
  const blockerMock = vi.fn(() => true);

  const history = createMemoryHistory({ initialEntries: [{}] });

  const unregister = history.block(blockerMock);

  unregister();
  history.push('/aaa?xxx=111');

  expect(blockerMock).not.toHaveBeenCalled();

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/aaa',
    searchParams: {
      xxx: 111,
    },
    state: undefined,
  } satisfies Location);
});

test('canGoBack returns true only for not-first entry', () => {
  const history = createMemoryHistory({ initialEntries: [{}] });

  expect(history.canGoBack).toBe(false);

  history.push('/aaa');

  expect(history.canGoBack).toBe(true);

  history.back();

  expect(history.canGoBack).toBe(false);
});
