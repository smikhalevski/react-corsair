import { render, renderHook } from '@testing-library/react';
import { createRoute, Router, RouterProvider, useRoute, useRouter } from '../main';
import { noop } from '../main/utils';
import React, { act, ReactNode, StrictMode } from 'react';

console.error = noop;

describe('RouterProvider', () => {
  test('re-renders on navigation', async () => {
    const route = createRoute('/aaa', () => 'AAA');
    const router = new Router({ routes: [route], context: undefined });

    const result = render(<RouterProvider router={router} />);

    expect(result.container.innerHTML).toBe('');

    act(() => router.navigate(route));

    expect(result.container.innerHTML).toBe('AAA');
  });
});

describe('useRouter', () => {
  test('throws if used outside of RouterProvider', () => {
    expect(() => renderHook(() => useRouter())).toThrow(new Error('Cannot be used outside of RouterProvider'));
  });

  test('returns Router instance', () => {
    const router = new Router({ routes: [], context: undefined });

    const hook = renderHook(() => useRouter(), {
      wrapper: props => (
        <StrictMode>
          <RouterProvider router={router}>{props.children}</RouterProvider>
        </StrictMode>
      ),
    });

    expect(hook.result.current).toBe(router);
  });
});
