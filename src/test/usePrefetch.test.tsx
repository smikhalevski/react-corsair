/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRoute, DataLoaderOptions, Router, RouterProvider, usePrefetch } from '../main/index.js';
import { noop } from '../main/utils.js';
import React, { StrictMode } from 'react';

console.error = noop;

test('starts route loading when mounted', () => {
  const dataLoaderMock = vi.fn();

  const route = createRoute({ dataLoader: dataLoaderMock });

  const router = new Router({ routes: [route], context: 'zzz' });

  renderHook(() => usePrefetch(route.getLocation({ xxx: 111 })), {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(dataLoaderMock).toHaveBeenCalledTimes(1);
  expect(dataLoaderMock).toHaveBeenNthCalledWith(1, {
    route,
    router,
    params: { xxx: 111 },
    signal: expect.any(AbortSignal),
    isPrefetch: true,
  } satisfies DataLoaderOptions<any, any>);
});

test('restart loading only if location is changed', () => {
  const dataLoaderAaaMock = vi.fn();
  const dataLoaderBbbMock = vi.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    dataLoader: dataLoaderAaaMock,
  });

  const routeBbb = createRoute({
    pathname: '/bbb',
    dataLoader: dataLoaderBbbMock,
  });

  const router = new Router({ routes: [routeAaa, routeBbb] });

  const hook = renderHook(props => usePrefetch(props.to), {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
    initialProps: { to: routeAaa },
  });

  hook.rerender({ to: routeAaa });
  hook.rerender({ to: routeAaa });
  hook.rerender({ to: routeAaa });

  expect(dataLoaderAaaMock).toHaveBeenCalledTimes(1);
  expect(dataLoaderBbbMock).toHaveBeenCalledTimes(0);

  hook.rerender({ to: routeBbb });

  expect(dataLoaderAaaMock).toHaveBeenCalledTimes(1);
  expect(dataLoaderBbbMock).toHaveBeenCalledTimes(1);
});
