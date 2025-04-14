import { render, renderHook } from '@testing-library/react';
import { createRoute, DataLoaderOptions, Outlet, Router, RouterProvider, useInlineRoute, usePrefetch } from '../main';
import { noop } from '../main/utils';
import React, { FC, PropsWithChildren, StrictMode } from 'react';

test('returns the route controller', () => {
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route] });

  const hook = renderHook(() => useInlineRoute(route.getLocation({ xxx: 111 })), {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  const controller = hook.result.current;

  expect(controller!.route).toBe(route);
  expect(controller!.params).toStrictEqual({ xxx: 111 });
});

test('returns null if no route was matched', () => {
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route] });

  const hook = renderHook(() => useInlineRoute({}), {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(hook.result.current).toBeNull();
});
