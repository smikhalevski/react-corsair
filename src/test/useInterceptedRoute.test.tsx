import { render } from '@testing-library/react';
import { createRoute, Router, RouterProvider, useInterceptedRoute } from '../main';
import React, { act, StrictMode } from 'react';

test('returns the intercepted controller of the provided route or null', () => {
  const hookTrap = jest.fn();

  const routeAaa = createRoute('/aaa', () => {
    hookTrap(useInterceptedRoute(routeBbb));
    return null;
  });

  const routeBbb = createRoute(routeAaa, '/bbb');

  const router = new Router({ routes: [routeAaa, routeBbb] });

  router.navigate(routeAaa);

  render(
    <StrictMode>
      <RouterProvider value={router} />
    </StrictMode>
  );

  expect(hookTrap).toHaveBeenCalledTimes(2);
  expect(hookTrap).toHaveBeenNthCalledWith(1, null);
  expect(hookTrap).toHaveBeenNthCalledWith(2, null);

  act(() => router.navigate(routeBbb));

  expect(hookTrap).toHaveBeenCalledTimes(4);
  expect(hookTrap.mock.calls[2][0].route).toBe(routeBbb);
  expect(hookTrap.mock.calls[3][0].route).toBe(routeBbb);
});
