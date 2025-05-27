/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React, { StrictMode } from 'react';
import {
  createMemoryHistory,
  HistoryProvider,
  HistoryTransaction,
  useHistoryBlocker,
} from '../../main/history/index.js';
import { Location } from '../../main/index.js';

test('returns history transaction', () => {
  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  expect(hook.result.current).toBeNull();

  act(() => history.push('/aaa?xxx=111'));

  expect(hook.result.current).toEqual({
    type: 'push',
    location: {
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    },
    proceed: expect.any(Function),
    cancel: expect.any(Function),
  } satisfies HistoryTransaction);

  expect(history.location).toEqual({
    pathname: '/zzz',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('proceeds the history transaction', () => {
  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  act(() => history.push('/aaa?xxx=111'));

  act(() => hook.result.current!.proceed());

  expect(hook.result.current).toBeNull();

  expect(history.location).toEqual({
    pathname: '/aaa',
    searchParams: { xxx: 111 },
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('cancels the history transaction', () => {
  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  act(() => history.push('/aaa?xxx=111'));

  act(() => hook.result.current!.cancel());

  expect(hook.result.current).toBeNull();

  expect(history.location).toEqual({
    pathname: '/zzz',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('returns history transaction if blocker function returns undefined', () => {
  const blockerMock = vi.fn(() => undefined);

  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(blockerMock), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  expect(hook.result.current).toBeNull();

  act(() => history.push('/aaa?xxx=111'));

  const tx: HistoryTransaction = {
    type: 'push',
    location: {
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    },
    proceed: expect.any(Function),
    cancel: expect.any(Function),
  };

  expect(blockerMock).toHaveBeenCalledTimes(1);
  expect(blockerMock).toHaveBeenNthCalledWith(1, tx);

  expect(hook.result.current).toEqual(tx);

  expect(history.location).toEqual({
    pathname: '/zzz',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('proceeds the history transaction if blocker function returns false', () => {
  const blockerMock = vi.fn(() => false);

  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(blockerMock), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  act(() => history.push('/aaa?xxx=111'));

  expect(blockerMock).toHaveBeenCalledTimes(1);
  expect(blockerMock).toHaveBeenNthCalledWith(1, {
    type: 'push',
    location: {
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    },
    proceed: expect.any(Function),
    cancel: expect.any(Function),
  } satisfies HistoryTransaction);

  expect(hook.result.current).toBeNull();

  expect(history.location).toEqual({
    pathname: '/aaa',
    searchParams: { xxx: 111 },
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('cancels the history transaction if blocker function returns true', () => {
  const blockerMock = vi.fn(() => true);

  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(blockerMock), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  act(() => history.push('/aaa?xxx=111'));

  expect(blockerMock).toHaveBeenCalledTimes(1);
  expect(blockerMock).toHaveBeenNthCalledWith(1, {
    type: 'push',
    location: {
      pathname: '/aaa',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    },
    proceed: expect.any(Function),
    cancel: expect.any(Function),
  } satisfies HistoryTransaction);

  expect(hook.result.current).toBeNull();

  expect(history.location).toEqual({
    pathname: '/zzz',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('proceeds the history transaction if blocker is false', () => {
  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(false), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  act(() => history.push('/aaa?xxx=111'));

  expect(hook.result.current).toBeNull();

  expect(history.location).toEqual({
    pathname: '/aaa',
    searchParams: { xxx: 111 },
    hash: '',
    state: undefined,
  } satisfies Location);
});

test('cancels the history transaction if blocker is true', () => {
  const history = createMemoryHistory(['/zzz']);

  const hook = renderHook(() => useHistoryBlocker(true), {
    wrapper: props => (
      <StrictMode>
        <HistoryProvider value={history}>{props.children}</HistoryProvider>
      </StrictMode>
    ),
  });

  act(() => history.push('/aaa?xxx=111'));

  expect(hook.result.current).toBeNull();

  expect(history.location).toEqual({
    pathname: '/zzz',
    searchParams: {},
    hash: '',
    state: undefined,
  } satisfies Location);
});
