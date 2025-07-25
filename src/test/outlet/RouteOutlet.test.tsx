/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import {
  createRoute,
  notFound,
  Outlet,
  Redirect,
  redirect,
  RouteOutlet,
  Router,
  RouterEvent,
  RouteState,
} from '../../main/index.js';
import { noop } from '../../main/utils.js';
import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';

console.error = noop;

test('renders the route component', () => {
  const listenerMock = vi.fn();
  const route = createRoute('/aaa', () => 'AAA');
  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);
});

test('renders the nested route component in the nested Outlet', () => {
  const listenerMock = vi.fn();

  const routeAaa = createRoute('/aaa', () => (
    <div id={'aaa'}>
      <Outlet />
    </div>
  ));

  const routeBbb = createRoute(routeAaa, '/bbb', () => 'BBB');

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(renderResult.container.innerHTML).toBe('<div id="aaa">BBB</div>');

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);
});

test('renders route errorComponent if an error is thrown during rendering', () => {
  const listenerMock = vi.fn();

  const error = new Error('expected');

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

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'error',
    controller: router.rootController!,
    error,
  } satisfies RouterEvent);
});

test('renders router errorComponent if an error is thrown during rendering', () => {
  const error = new Error('expected');

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

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');
});

test('error bubbles to the closest route with an errorComponent if an error is thrown during rendering ', () => {
  const listenerMock = vi.fn();

  const error = new Error('expected');

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

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
  expect(router.rootController!.childController!['_state']).toStrictEqual({
    status: 'error',
    error,
  } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');

  expect(listenerMock).toHaveBeenCalledTimes(5);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'error',
    controller: router.rootController!.childController!,
    error,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'error',
    controller: router.rootController!,
    error,
  } satisfies RouterEvent);
});

test('error bubbles to the closest route with an errorComponent if an error is thrown from a data loader', () => {
  const listenerMock = vi.fn();

  const error = new Error('expected');

  const routeAaa = createRoute({
    pathname: '/aaa',
    errorComponent: () => {
      return 'XXX';
    },
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => 'BBB',
    dataLoader: () => {
      throw error;
    },
  });

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
  expect(router.rootController!.childController!['_state']).toStrictEqual({
    status: 'error',
    error,
  } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');

  expect(listenerMock).toHaveBeenCalledTimes(4);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'error',
    controller: router.rootController!.childController!,
    error,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'error',
    controller: router.rootController!,
    error,
  } satisfies RouterEvent);
});

test('rendering throws an error if no errorComponent exists', () => {
  const error = new Error('expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw error;
    },
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  expect(() => render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode })).toThrow(error);

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
});

test('renders an errorComponent if an error is thrown from loadingComponent', () => {
  const listenerMock = vi.fn();
  const error = new Error('expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw new Promise(noop);
    },
    loadingComponent: () => {
      throw error;
    },
    errorComponent: () => {
      return 'XXX';
    },
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'error',
    controller: router.rootController!,
    error,
  } satisfies RouterEvent);
});

test('renders an errorComponent if an error is thrown from notFoundComponent', () => {
  const listenerMock = vi.fn();

  const error = new Error('expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => notFound(),
    notFoundComponent: () => {
      throw error;
    },
    errorComponent: () => {
      return 'XXX';
    },
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');

  expect(listenerMock).toHaveBeenCalledTimes(4);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'error',
    controller: router.rootController!,
    error,
  } satisfies RouterEvent);
});

test('redirect can be thrown from errorComponent', () => {
  const listenerMock = vi.fn();

  const error = new Error('expected');

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw error;
    },
    loadingComponent: () => 'AAA',
    errorComponent: () => redirect('zzz'),
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(4);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'error',
    controller: router.rootController!,
    error,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);
});

test('renders loadingComponent of a route', () => {
  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => new Promise(noop),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.navigate(route);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
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

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
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

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'ready', data: undefined } satisfies RouteState);
  expect(router.rootController!.childController!['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');
});

test('render re-throws redirect if it was thrown by a loadingComponent', () => {
  const listenerMock = vi.fn();

  const route = createRoute({
    pathname: '/aaa',
    component: () => {
      throw new Promise(noop);
    },
    loadingComponent: () => redirect('zzz'),
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(() => render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode })).toThrow(Redirect);

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);
});

test('redirect bubbles to the closest route with an loadingComponent that does not throw a redirect', () => {
  const listenerMock = vi.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    loadingComponent: () => {
      return 'XXX';
    },
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => redirect('zzz'),
    loadingComponent: () => redirect('rrr'),
  });

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'rrr' } satisfies RouteState);
  expect(router.rootController!.childController!['_state']).toStrictEqual({
    status: 'redirect',
    to: 'rrr',
  } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('XXX');

  expect(listenerMock).toHaveBeenCalledTimes(6);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'redirect',
    controller: router.rootController!.childController!,
    to: 'zzz',
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'redirect',
    controller: router.rootController!.childController!,
    to: 'rrr',
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(6, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'rrr',
  } satisfies RouterEvent);
});

test('renders notFoundComponent if notFound is called during rendering', () => {
  const listenerMock = vi.fn();

  const route = createRoute({
    pathname: '/aaa',
    component: () => notFound(),
    notFoundComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);
});

test('renders notFoundComponent if notFound is called from a data loader', () => {
  const listenerMock = vi.fn();

  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => notFound(),
    notFoundComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('not found bubbles to the closest route with a notFoundComponent if notFound is called during rendering', () => {
  const listenerMock = vi.fn();

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

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(5);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'not_found',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);
});

test('not found bubbles to the closest route with a notFoundComponent if notFound is called from a data loader', () => {
  const listenerMock = vi.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    notFoundComponent: () => 'AAA',
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => 'BBB',
    dataLoader: () => notFound(),
  });

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(4);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'not_found',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'not_found',
    controller: router.rootController!,
  } satisfies RouterEvent);
});

test('renders loadingComponent if redirect is called during rendering', () => {
  const listenerMock = vi.fn();

  const route = createRoute({
    pathname: '/aaa',
    component: () => redirect('zzz'),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);
  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);
});

test('renders loadingComponent if redirect is called from a data loader', () => {
  const listenerMock = vi.fn();

  const route = createRoute({
    pathname: '/aaa',
    dataLoader: () => redirect('zzz'),
    loadingComponent: () => 'AAA',
  });

  const router = new Router({ routes: [route] });

  router.subscribe(listenerMock);
  router.navigate(route);

  expect(listenerMock).toHaveBeenCalledTimes(2);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('redirect bubbles to the closest route with a loadingComponent if redirect is called during rendering', () => {
  const listenerMock = vi.fn();

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

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'ready',
    controller: router.rootController!.childController!,
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(5);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'redirect',
    controller: router.rootController!.childController!,
    to: 'zzz',
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);
});

test('redirect bubbles to the closest route with a loadingComponent if redirect is called from a data loader', () => {
  const listenerMock = vi.fn();

  const routeAaa = createRoute({
    pathname: '/aaa',
    loadingComponent: () => 'AAA',
  });

  const routeBbb = createRoute(routeAaa, {
    pathname: '/bbb',
    component: () => 'BBB',
    dataLoader: () => redirect('zzz'),
  });

  const router = new Router({ routes: [routeBbb] });

  router.subscribe(listenerMock);
  router.navigate(routeBbb);

  expect(listenerMock).toHaveBeenCalledTimes(3);

  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'navigate',
    controller: router.rootController,
    router,
    location: { pathname: '/aaa/bbb', searchParams: {}, hash: '', state: undefined },
    isIntercepted: false,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'ready',
    controller: router.rootController!,
  } satisfies RouterEvent);

  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'redirect',
    controller: router.rootController!.childController!,
    to: 'zzz',
  } satisfies RouterEvent);

  const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
    onRecoverableError: noop,
    wrapper: StrictMode,
  });

  expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
  expect(renderResult.container.innerHTML).toBe('AAA');

  expect(listenerMock).toHaveBeenCalledTimes(4);

  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'redirect',
    controller: router.rootController!,
    to: 'zzz',
  } satisfies RouterEvent);
});
