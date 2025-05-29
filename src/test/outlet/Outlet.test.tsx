/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest';
import { createRoute, Outlet, Router, RouterProvider } from '../../main/index.js';
import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { noop } from '../../main/utils.js';

console.error = noop;

test('renders null if no route matched and router does not have notFoundComponent', () => {
  const router = new Router({ routes: [] });

  const result = render(
    <RouterProvider value={router}>
      <Outlet />
    </RouterProvider>,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('');
});

test('renders notFoundComponent if no route matched', () => {
  const router = new Router({ routes: [], notFoundComponent: () => 'AAA' });

  const result = render(
    <RouterProvider value={router}>
      <Outlet />
    </RouterProvider>,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('AAA');
});

test('renders route component if route was matched', () => {
  const route = createRoute('/', () => 'AAA');
  const router = new Router({ routes: [route] });

  router.navigate(route);

  const result = render(
    <RouterProvider value={router}>
      <Outlet />
    </RouterProvider>,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('AAA');
});
