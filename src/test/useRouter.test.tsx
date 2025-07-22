/**
 * @vitest-environment jsdom
 */

import { describe, expect, test } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { createRoute, Router, RouterProvider, useRouter } from '../main/index.js';
import { noop } from '../main/utils.js';
import React, { act, StrictMode } from 'react';

console.error = noop;

describe('RouterProvider', () => {
  test('re-renders on navigation', () => {
    const routeAaa = createRoute('/aaa', () => 'AAA');
    const routeBbb = createRoute('/bbb', () => 'BBB');
    const router = new Router({ routes: [routeAaa, routeBbb] });

    router.navigate(routeAaa);

    const result = render(<RouterProvider value={router} />, { wrapper: StrictMode });

    expect(result.container.innerHTML).toBe('AAA');

    act(() => router.navigate(routeBbb));

    expect(result.container.innerHTML).toBe('BBB');
  });
});

describe('useRouter', () => {
  test('throws if used outside of RouterProvider', () => {
    expect(() => renderHook(() => useRouter())).toThrow(new Error('Cannot be used outside of a RouterProvider'));
  });

  test('returns Router instance', () => {
    const router = new Router({ routes: [] });

    const hook = renderHook(() => useRouter(), {
      wrapper: props => (
        <StrictMode>
          <RouterProvider value={router}>{props.children}</RouterProvider>
        </StrictMode>
      ),
    });

    expect(hook.result.current).toBe(router);
  });
});
