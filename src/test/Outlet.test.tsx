import { createRoute, Outlet, Router, RouterProvider, RouteState } from '../main';
import { render } from '@testing-library/react';
import React from 'react';
import { noop } from '../main/utils';

console.error = noop;

test('renders null if no route matched and router does not have notFoundComponent', () => {
  const router = new Router({ routes: [], context: undefined });

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(renderResult.container.innerHTML).toBe('');
});

test('renders router notFoundComponent if no route matched', () => {
  const router = new Router({
    routes: [],
    context: undefined,
    notFoundComponent: () => 'XXX',
  });

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('renders route component in an outlet', () => {
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route], context: undefined });

  router.navigate(route);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('renders route component in an outlet with a wrapper', () => {
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route], context: undefined });

  router.navigate(route);

  const renderResult = render(
    <RouterProvider router={router}>
      <blockquote>
        <Outlet />
      </blockquote>
    </RouterProvider>
  );

  expect(renderResult.container.innerHTML).toBe('<blockquote>AAA</blockquote>');
});

test('renders nested route component in a nested outlet', () => {
  const routeAaa = createRoute('/aaa', () => (
    <div id={'aaa'}>
      <Outlet />
    </div>
  ));

  const routeBbb = createRoute(routeAaa, '/bbb', () => 'BBB');

  const router = new Router({ routes: [routeBbb], context: undefined });

  router.navigate(routeBbb);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(renderResult.container.innerHTML).toBe('<div id="aaa">BBB</div>');
});

test('renders route errorComponent if an error is thrown during rendering', () => {
  const error = new Error('Expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw error;
    },
    errorComponent: () => {
      return 'XXX';
    },
  });

  const router = new Router({ routes: [route], context: undefined });

  router.navigate(route);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('renders router errorComponent if an error is thrown during rendering', () => {
  const error = new Error('Expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw error;
    },
  });

  const router = new Router({
    routes: [route],
    context: undefined,
    errorComponent: () => {
      return 'XXX';
    },
  });

  router.navigate(route);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('rendering error bubbles to the closest route with an errorComponent', () => {
  const error = new Error('Expected');

  const routeAaa = createRoute({
    pathname: '/aaa',
    errorComponent: () => {
      return 'XXX';
    },
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => {
      throw error;
    },
  });

  const router = new Router({ routes: [routeBbb], context: undefined });

  router.navigate(routeBbb);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(router.rootController!.childController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('throws error if no errorComponent exists', () => {
  const error = new Error('Expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw error;
    },
  });

  const router = new Router({ routes: [route], context: undefined });

  router.navigate(route);

  expect(() =>
    render(
      <RouterProvider router={router}>
        <Outlet />
      </RouterProvider>
    )
  ).toThrow(error);

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
});

test('renders loadingComponent', () => {
  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => new Promise(noop),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route], context: undefined });

  router.navigate(route);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(router.rootController!.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('loading bubbles to the closest route with a loadingComponent', () => {
  const routeAaa = createRoute({
    pathname: '/aaa',
    loadingComponent: () => 'AAA',
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    dataLoader: () => new Promise(noop),
  });

  const router = new Router({ routes: [routeBbb], context: undefined });

  router.navigate(routeBbb);

  const renderResult = render(
    <RouterProvider router={router}>
      <Outlet />
    </RouterProvider>
  );

  expect(router.rootController!.state).toEqual({ status: 'ok', data: undefined } satisfies RouteState);
  expect(router.rootController!.childController!.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});
