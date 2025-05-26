/**
 * @vitest-environment jsdom
 */

import { beforeEach, expect, test, vi } from 'vitest';
import { delay } from 'parallel-universe';
import { createHashHistory, jsonSearchParamsSerializer } from '../..//main/history/index.js';
import { Location } from '../../main/index.js';

beforeEach(() => {
  window.history.pushState(null, '', '/');
});

test('pushes location', async () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };

  const history = createHashHistory();

  expect(history.location).toStrictEqual({
    pathname: '/',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);

  history.push(aaaLocation);

  expect(history.location).toStrictEqual(aaaLocation);
});

test('replaces location', async () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const cccLocation: Location = { pathname: '/ccc', searchParams: {}, hash: '', state: undefined };

  const history = createHashHistory();

  history.replace(bbbLocation);

  expect(history.location).toStrictEqual(bbbLocation);

  history.back();

  await delay(50);

  expect(history.location).toStrictEqual(bbbLocation);

  history.push(aaaLocation);

  expect(history.location).toStrictEqual(aaaLocation);

  history.replace(cccLocation);

  expect(history.location).toStrictEqual(cccLocation);
});

test('calls listener on push', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const listenerMock = vi.fn();

  const history = createHashHistory();

  history.subscribe(listenerMock);
  history.push(aaaLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on replace', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const listenerMock = vi.fn();

  const history = createHashHistory();

  history.subscribe(listenerMock);
  history.replace(aaaLocation);

  expect(listenerMock).toHaveBeenCalledTimes(1);
});

test('calls listener on back', () => {
  const aaaLocation: Location = { pathname: '/aaa', searchParams: {}, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: {}, hash: '', state: undefined };
  const listenerMock = vi.fn();

  const history = createHashHistory();

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
  const aaaLocation: Location = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '', state: undefined };
  const bbbLocation: Location = { pathname: '/bbb', searchParams: { yyy: [111, 222] }, hash: '', state: undefined };

  const history = createHashHistory();

  history.push(aaaLocation);

  expect(history.location).toStrictEqual({
    pathname: '/aaa',
    searchParams: { xxx: 111 },
    hash: '',
    state: undefined,
  } satisfies Location);

  expect(window.location.href).toBe('http://localhost:3000/#/aaa?xxx=111');

  history.push(bbbLocation);

  expect(history.location).toStrictEqual({
    pathname: '/bbb',
    searchParams: { yyy: [111, 222] },
    hash: '',
    state: undefined,
  } satisfies Location);

  expect(window.location.href).toBe('http://localhost:3000/#/bbb?yyy=[111,222]');
});

test('parses query params with a custom adapter', async () => {
  vi.spyOn(jsonSearchParamsSerializer, 'parse');
  vi.spyOn(jsonSearchParamsSerializer, 'stringify');

  const aaaLocation = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' };

  const history = createHashHistory();

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
  expect(createHashHistory().toAbsoluteURL({ pathname: '/aaa/bbb', searchParams: { xxx: 111 }, hash: '' })).toBe(
    '#/aaa/bbb?xxx=111'
  );
});

test('creates an absolute URL with a default base', async () => {
  expect(
    createHashHistory({ basePathname: 'http://bbb.ccc' }).toAbsoluteURL({
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
    })
  ).toBe('http://bbb.ccc/#/aaa?xxx=111');
});
