import { render, renderHook } from '@testing-library/react';
import { createRoute, Router, RouterProvider, usePrefetch, useRoute } from '../main';
import { noop } from '../main/utils';
import React, { act, FC, PropsWithChildren, StrictMode } from 'react';

console.error = noop;

test('starts route loading when mounted', () => {
  const dataLoaderMock = jest.fn();

  const route = createRoute({
    pathname: '/aaa',
    dataLoader: dataLoaderMock,
  });

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
    context: 'zzz',
    signal: expect.any(AbortSignal),
    isPrefetch: true,
  });
});

test('restart loading only if location is changed', () => {
  const dataLoaderAaaMock = jest.fn();
  const dataLoaderBbbMock = jest.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    dataLoader: dataLoaderAaaMock,
  });

  const routeBbb = createRoute({
    pathname: '/bbb',
    dataLoader: dataLoaderBbbMock,
  });

  const router = new Router({ routes: [routeAaa, routeBbb] });

  const wrapper: FC<PropsWithChildren> = props => (
    <StrictMode>
      <RouterProvider value={router}>{props.children}</RouterProvider>
    </StrictMode>
  );

  const hook = renderHook(props => usePrefetch(props.to), {
    wrapper,
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
