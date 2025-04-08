import { createMemoryHistory, HistoryTransaction } from '../../main/history';
import { createRoute, Location } from '../../main';
import { HistoryBlocker } from '../../main/history/types';

test('throws if there is no initial entry', () => {
  expect(() => createMemoryHistory([])).toThrow(new Error('Expected at least one initial entry'));
});

test('parses initial entries', () => {
  expect(createMemoryHistory(['/aaa?xxx=yyy']).location).toStrictEqual({
    pathname: '/aaa',
    searchParams: { xxx: 'yyy' },
    hash: '',
    state: undefined,
  } satisfies Location);
  expect(createMemoryHistory([createRoute({ pathname: '/aaa' })]).location).toStrictEqual({
    pathname: '/aaa',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('pushes location', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const cccLocation: Location = { pathname: '/ccc', searchParams: {}, hash: '', state: undefined };

  const history = createMemoryHistory([aaaLocation]);

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

  const history = createMemoryHistory([aaaLocation]);

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
  const listenerMock = jest.fn();

  const history = createMemoryHistory([aaaLocation]);

  history.subscribe(listenerMock);
  history.push(bbbLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on replace', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const listenerMock = jest.fn();

  const history = createMemoryHistory([aaaLocation]);

  history.subscribe(listenerMock);
  history.replace(bbbLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on back', () => {
  const listenerMock = jest.fn();

  const history = createMemoryHistory(
    [
      { pathname: '/aaa', searchParams: {}, hash: '' },
      { pathname: '/bbb', searchParams: {}, hash: '' },
      { pathname: '/ccc', searchParams: {}, hash: '' },
    ],
    {}
  );

  history.subscribe(listenerMock);
  history.back();
  history.back();
  history.back();

  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('creates an absolute URL', async () => {
  expect(createMemoryHistory([{}]).toAbsoluteURL({ pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' })).toBe(
    '/aaa?xxx=111'
  );
});

test('creates an absolute URL with a default base', async () => {
  expect(
    createMemoryHistory([{}], { basePathname: 'http://bbb.ccc' }).toAbsoluteURL({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
    })
  ).toBe('http://bbb.ccc/aaa?xxx=111');
});

test('does not block the navigation', async () => {
  const blockerMock = jest.fn();

  const history = createMemoryHistory([{}]);

  history.block(blockerMock);

  history.push('/aaa?xxx=111');

  expect(blockerMock).toHaveBeenCalledTimes(1);
  expect(blockerMock.mock.calls[0][0]).toStrictEqual({
    location: {
      hash: '',
      pathname: '/aaa',
      searchParams: {
        xxx: 111,
      },
      state: undefined,
    },
    proceed: expect.any(Function),
  } satisfies HistoryTransaction);

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/aaa',
    searchParams: {
      xxx: 111,
    },
    state: undefined,
  } as Location);
});

test('blocks the navigation', async () => {
  const blockerMock = jest.fn(() => true);

  const history = createMemoryHistory([{}]);

  history.block(blockerMock);

  history.push('/aaa?xxx=111');

  expect(blockerMock).toHaveBeenCalledTimes(1);

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/',
    searchParams: {},
    state: undefined,
  } as Location);
});

test('proceeds with the navigation after blocking', async () => {
  const history = createMemoryHistory([{}]);

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
  } as Location);

  proceed!();

  expect(history.location).toStrictEqual({
    hash: '',
    pathname: '/aaa',
    searchParams: {
      xxx: 111,
    },
    state: undefined,
  } as Location);
});

test('proceeds with the navigation during blocking', async () => {
  const history = createMemoryHistory([{}]);

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
  } as Location);
});

test('calls all blockers', async () => {
  const blockerMock1 = jest.fn();
  const blockerMock2 = jest.fn();

  const history = createMemoryHistory([{}]);

  history.block(blockerMock1);
  history.block(blockerMock2);

  history.push('/aaa?xxx=111');

  expect(blockerMock1).toHaveBeenCalledTimes(1);
  expect(blockerMock2).toHaveBeenCalledTimes(1);
});

test('does not call the next blocker if true is returned', async () => {
  const blockerMock1 = jest.fn(() => true);
  const blockerMock2 = jest.fn();

  const history = createMemoryHistory([{}]);

  history.block(blockerMock1);
  history.block(blockerMock2);

  history.push('/aaa?xxx=111');

  expect(blockerMock1).toHaveBeenCalledTimes(1);
  expect(blockerMock2).not.toHaveBeenCalled();
});

test('unregisters a blocker', async () => {
  const blockerMock = jest.fn(() => true);

  const history = createMemoryHistory([{}]);

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
  } as Location);
});
