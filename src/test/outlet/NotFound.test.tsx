/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest';
import { Router, RouterProvider } from '../../main/index.js';
import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { NotFound } from '../../main/outlet/NotFound.js';
import { noop } from '../../main/utils.js';

console.error = noop;

test('renders null if router does not have notFoundComponent', () => {
  const router = new Router({ routes: [] });

  const result = render(<NotFound />, {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(result.container.innerHTML).toBe('');
});

test('renders notFoundComponent', () => {
  const router = new Router({ routes: [], notFoundComponent: () => 'AAA' });

  const result = render(<NotFound />, {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(result.container.innerHTML).toBe('AAA');
});

test('renders errorComponent if notFoundComponent throws an error during rendering', () => {
  const router = new Router({
    routes: [],
    notFoundComponent: () => {
      throw new Error('expected');
    },
    errorComponent: () => 'AAA',
  });

  const result = render(<NotFound />, {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(result.container.innerHTML).toBe('AAA');
});

test('renders loadingComponent if notFoundComponent throws a promise', () => {
  const router = new Router({
    routes: [],
    notFoundComponent: () => {
      throw new Promise(noop);
    },
    loadingComponent: () => 'AAA',
  });

  const result = render(<NotFound />, {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(result.container.innerHTML).toBe('AAA');
});

test('renders errorComponent if loadingComponent throws an error during rendering', () => {
  const router = new Router({
    routes: [],
    notFoundComponent: () => {
      throw Promise.resolve();
    },
    loadingComponent: () => {
      throw new Error('expected');
    },
    errorComponent: () => 'AAA',
  });

  const result = render(<NotFound />, {
    wrapper: props => (
      <StrictMode>
        <RouterProvider value={router}>{props.children}</RouterProvider>
      </StrictMode>
    ),
  });

  expect(result.container.innerHTML).toBe('AAA');
});
