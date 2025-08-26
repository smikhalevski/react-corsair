/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BrowserHistory, createBrowserHistory, jsonSearchParamsSerializer } from '../..//main/history/index.js';
import { Location } from '../../main/index.js';

let history: BrowserHistory | undefined;

beforeEach(() => {
  history = undefined;
  window.history.pushState(null, '', '/');
});

afterEach(() => {
  history?.start()();
});

test('removes base from location', async () => {
  window.history.pushState(null, '', '/aaa/bbb');

  expect(window.location.href).toBe('http://localhost:3000/aaa/bbb');

  expect(createBrowserHistory({ basePathname: '/aaa' }).location).toStrictEqual({
    pathname: '/bbb',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);

  expect(createBrowserHistory({ basePathname: '/aaa/' }).location).toStrictEqual({
    pathname: '/bbb',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('pushes location', async () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };

  history = createBrowserHistory();
  history.start();

  // expect(history.location).toStrictEqual({ pathname: '/', searchParams: {}, hash: '', state: undefined });

  history.push(aaaLocation);

  expect(history.location).toStrictEqual(aaaLocation);

  history.back();

  // expect(history.location).toStrictEqual({ pathname: '/', searchParams: {}, hash: '', state: undefined });

  expect(history.location).not.toBe(aaaLocation.pathname);
});

test('replaces location', async () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const cccLocation: Location = { pathname: '/ccc', searchParams: {}, hash: '', state: undefined };

  history = createBrowserHistory();
  history.start();

  history.replace(bbbLocation);

  expect(history.location).toStrictEqual(bbbLocation);

  history.push(aaaLocation);

  expect(history.location).toStrictEqual(aaaLocation);

  history.replace(cccLocation);

  expect(history.location).toStrictEqual(cccLocation);
});

test('calls listener on push', () => {
  const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
  const listenerMock = vi.fn();

  history = createBrowserHistory();
  history.start();

  history.subscribe(listenerMock);
  history.push(aaaLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on replace', () => {
  const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
  const listenerMock = vi.fn();

  history = createBrowserHistory();
  history.start();

  history.subscribe(listenerMock);
  history.replace(aaaLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on back', () => {
  const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
  const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
  const listenerMock = vi.fn();

  history = createBrowserHistory();
  history.start();

  history.subscribe(listenerMock);
  history.push(aaaLocation);
  history.push(bbbLocation);
  history.back();
  history.back();
  history.back();
  history.back();

  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('parses query params', async () => {
  const aaaLocation = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' };
  const bbbLocation = { pathname: '/bbb', searchParams: { yyy: [111, 222] }, hash: '' };

  history = createBrowserHistory();
  history.start();

  history.push(aaaLocation);

  expect(history.location).toStrictEqual({ pathname: '/aaa', searchParams: { xxx: 111 }, hash: '', state: undefined });

  expect(window.location.href).toBe('http://localhost:3000/aaa?xxx=111');

  history.push(bbbLocation);

  expect(history.location).toStrictEqual({
    pathname: '/bbb',
    searchParams: { yyy: [111, 222] },
    hash: '',
    state: undefined,
  });

  expect(window.location.href).toBe('http://localhost:3000/bbb?yyy=[111,222]');
});

test('parses query params with a custom adapter', async () => {
  vi.spyOn(jsonSearchParamsSerializer, 'parse');
  vi.spyOn(jsonSearchParamsSerializer, 'stringify');

  const aaaLocation = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' };

  history = createBrowserHistory();
  history.start();

  history.push(aaaLocation);

  expect(jsonSearchParamsSerializer.parse).toHaveBeenCalledTimes(2);
  expect(jsonSearchParamsSerializer.stringify).toHaveBeenCalledTimes(1);
  expect(jsonSearchParamsSerializer.stringify).toHaveBeenNthCalledWith(1, { xxx: 111 });

  history.location;

  expect(jsonSearchParamsSerializer.stringify).toHaveBeenCalledTimes(1);
  expect(jsonSearchParamsSerializer.parse).toHaveBeenCalledTimes(2);
  expect(jsonSearchParamsSerializer.parse).toHaveBeenNthCalledWith(1, '');
  expect(jsonSearchParamsSerializer.parse).toHaveBeenNthCalledWith(2, 'xxx=111');
});

test('creates an absolute URL', async () => {
  expect(createBrowserHistory().toAbsoluteURL({ pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' })).toBe(
    '/aaa?xxx=111'
  );
});

test('creates an absolute URL with a default base', async () => {
  expect(
    createBrowserHistory({ basePathname: '/' }).toAbsoluteURL({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
    })
  ).toBe('/aaa?xxx=111');
});

test('returns the current history-local URL', async () => {
  history = createBrowserHistory();
  history.start();

  history.push({ pathname: '/aaa', searchParams: { xxx: '111' } });

  expect(history.url).toBe('/aaa?xxx=111');
});

test('creates a history-local URL', async () => {
  expect(
    createBrowserHistory({ basePathname: '/' }).toURL({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
    })
  ).toBe('/aaa?xxx=111');
});

test('canGoBack returns true only for not-first entry', async () => {
  history = createBrowserHistory();
  history.start();

  expect(history.canGoBack).toBe(false);

  history.push('/aaa');

  expect(history.canGoBack).toBe(true);

  const popstatePromise = new Promise<void>(resolve => history!.subscribe(resolve));

  history.back();

  await popstatePromise;

  expect(history.canGoBack).toBe(false);
});
