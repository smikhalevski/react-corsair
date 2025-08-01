/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { createRoute, Router, RouterProvider, useRoute } from '../main/index.js';
import { noop } from '../main/utils.js';
import React, { act, StrictMode } from 'react';

console.error = noop;

test('throws if used outside of RouterProvider', () => {
  expect(() => renderHook(() => useRoute())).toThrow(new Error('Cannot be used outside of a route'));
});

test('returns the current route controller', () => {
  const hookTrap = vi.fn();

  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute(routeAaa, '/bbb', () => {
    hookTrap(useRoute());
    return null;
  });

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  render(<RouterProvider value={router} />, { wrapper: StrictMode });

  expect(hookTrap).toHaveBeenCalledTimes(2);
  expect(hookTrap).toHaveBeenNthCalledWith(1, router.rootController.childController);
  expect(hookTrap).toHaveBeenNthCalledWith(2, router.rootController.childController);
});

test('returns the route controller of the provided route if it is the same as the current route', () => {
  const hookTrap = vi.fn();

  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute(routeAaa, '/bbb', () => {
    hookTrap(useRoute(routeBbb));
    return null;
  });

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  render(<RouterProvider value={router} />, { wrapper: StrictMode });

  expect(hookTrap).toHaveBeenCalledTimes(2);
  expect(hookTrap).toHaveBeenNthCalledWith(1, router.rootController.childController);
  expect(hookTrap).toHaveBeenNthCalledWith(2, router.rootController.childController);
});

test('returns the route controller of the provided route if it is the parent route', () => {
  const hookTrap = vi.fn();

  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute(routeAaa, '/bbb', () => {
    hookTrap(useRoute(routeAaa));
    return null;
  });

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  render(<RouterProvider value={router} />, { wrapper: StrictMode });

  expect(hookTrap).toHaveBeenCalledTimes(2);
  expect(hookTrap).toHaveBeenNthCalledWith(1, router.rootController);
  expect(hookTrap).toHaveBeenNthCalledWith(2, router.rootController);
});

test('throws if the provided route is a child', () => {
  const hookTrap = vi.fn();

  const routeAaa = createRoute('/aaa', () => {
    hookTrap(useRoute(routeBbb));
    return null;
  });

  const routeBbb = createRoute(routeAaa, '/bbb');

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  expect(() => render(<RouterProvider value={router} />, { wrapper: StrictMode })).toThrow(
    new Error('Cannot be used outside of a route')
  );
});

test('throws if the provided route is not rendered', () => {
  const hookTrap = vi.fn();

  const routeAaa = createRoute('/aaa', () => {
    hookTrap(useRoute(routeBbb));
    return null;
  });

  const routeBbb = createRoute('/bbb');

  const router = new Router({ routes: [routeAaa, routeBbb] });

  router.navigate(routeAaa);

  expect(() => render(<RouterProvider value={router} />, { wrapper: StrictMode })).toThrow(
    new Error('Cannot be used outside of a route')
  );
});

test('re-renders if controller state is changed', () => {
  const hookTrap = vi.fn();

  const route = createRoute('/aaa', () => {
    hookTrap(useRoute());
    return null;
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  render(<RouterProvider value={router} />, { wrapper: StrictMode });

  expect(hookTrap).toHaveBeenCalledTimes(2);

  act(() => router.rootController.setData('zzz'));

  expect(hookTrap).toHaveBeenCalledTimes(4);
});
