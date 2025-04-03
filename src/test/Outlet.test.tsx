import { createRoute, notFound, Outlet, redirect, Router, RouterEvent, RouterProvider, RouteState } from '../main';
import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { noop } from '../main/utils';

console.error = noop;

test('renders null if no route matched and router does not have notFoundComponent', () => {
  const router = new Router({ routes: [] });

  const result = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(result.container.innerHTML).toBe('');
});

test('renders router notFoundComponent if no route matched', () => {
  const router = new Router({
    routes: [],
    notFoundComponent: () => 'XXX',
  });

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('renders route component in an outlet', () => {
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('renders route component in an outlet with a wrapper', () => {
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <blockquote>
          <Outlet />
        </blockquote>
      </RouterProvider>
    </StrictMode>
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

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
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

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
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
    errorComponent: () => {
      return 'XXX';
    },
  });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('error bubbles to the closest route with an errorComponent', () => {
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

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(router.rootController!.childController!.state).toEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('rendering throws an error if no errorComponent exists', () => {
  const error = new Error('Expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw error;
    },
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  expect(() =>
    render(
      <StrictMode>
        <RouterProvider value={router}>
          <Outlet />
        </RouterProvider>
      </StrictMode>
    )
  ).toThrow(error);

  expect(router.rootController!.state).toEqual({ status: 'error', error } satisfies RouteState);
});

test('renders loadingComponent of a route', () => {
  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => new Promise(noop),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('renders loadingComponent of a router', () => {
  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => new Promise(noop),
  });

  const router = new Router({
    routes: [route],
    loadingComponent: () => 'AAA',
  });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
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

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'ok', data: undefined } satisfies RouteState);
  expect(router.rootController!.childController!.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('renders notFoundComponent if notFound is called during rendering', () => {
  const route = createRoute({
    pathname: '/aaa',
    component: () => notFound(),
    notFoundComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('renders notFoundComponent if notFound is called from data loader', () => {
  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => notFound(),
    notFoundComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('not found bubbles to the closest route with a notFoundComponent', () => {
  const listenerMock = jest.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    notFoundComponent: () => 'AAA',
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => notFound(),
  });

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(7);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'not_found',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  // Caused by StrictMode
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'not_found',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(6, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);

  // Caused by StrictMode
  expect(listenerMock).toHaveBeenNthCalledWith(7, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);
});

test('renders loadingComponent if redirect is called during rendering', () => {
  const route = createRoute({
    pathname: '/aaa',
    component: () => redirect('zzz'),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('renders loadingComponent if redirect is called from a data loader', () => {
  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => redirect('zzz'),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('redirect bubbles to the closest route with a loadingComponent', () => {
  const listenerMock = jest.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    loadingComponent: () => 'AAA',
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => redirect('zzz'),
  });

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(
    <StrictMode>
      <RouterProvider value={router}>
        <Outlet />
      </RouterProvider>
    </StrictMode>
  );

  expect(router.rootController!.state).toEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(7);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'redirect',
    controller: router.rootController!.childController!,
    to: 'zzz',
  } satisfies RouterEvent);

  // Caused by StrictMode
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'redirect',
    controller: router.rootController!.childController!,
    to: 'zzz',
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(6, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);

  // Caused by StrictMode
  expect(listenerMock).toHaveBeenNthCalledWith(7, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);
});
