/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import {
  createRoute,
  notFound,
  Outlet,
  redirect,
  Route,
  RouteController,
  RouteOutlet,
  Router,
  RouterEvent,
  RouteState,
} from '../../main/index.js';
import { noop } from '../../main/utils.js';
import { handleRouteError } from '../../main/outlet/RouteOutlet.js';
import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';

console.error = noop;

describe('RouteOutlet', () => {
  test('renders the route component', () => {
    const route = createRoute('/aaa', () => 'AAA');
    const router = new Router({ routes: [route] });

    router.navigate(route);

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

    expect(renderResult.container.innerHTML).toBe('AAA');
  });

  test('renders the nested route component in the nested Outlet', () => {
    const routeAaa = createRoute('/aaa', () => (
      <div id={'aaa'}>
        <Outlet />
      </div>
    ));

    const routeBbb = createRoute(routeAaa, '/bbb', () => 'BBB');

    const router = new Router({ routes: [routeBbb] });

    router.navigate(routeBbb);

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

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

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
      onRecoverableError: noop,
      wrapper: StrictMode,
    });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
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

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
      onRecoverableError: noop,
      wrapper: StrictMode,
    });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
    expect(renderResult.container.innerHTML).toBe('XXX');
  });

  test('renders an errorComponent if an error is thrown from loadingComponent', () => {
    const error = new Error('Expected');

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

    router.navigate(route);

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
      onRecoverableError: noop,
      wrapper: StrictMode,
    });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
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

    expect(() => render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode })).toThrow(error);

    expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
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

  test('renders notFoundComponent if notFound is called during rendering', () => {
    const route = createRoute({
      pathname: '/aaa',
      component: () => notFound(),
      notFoundComponent: () => 'AAA',
    });

    const router = new Router({ routes: [route] });

    router.navigate(route);

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
      onRecoverableError: noop,
      wrapper: StrictMode,
    });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
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

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
    expect(renderResult.container.innerHTML).toBe('AAA');
  });

  test('not found bubbles to the closest route with a notFoundComponent', () => {
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

  test('renders loadingComponent if redirect is called during rendering', () => {
    const route = createRoute({
      pathname: '/aaa',
      component: () => redirect('zzz'),
      loadingComponent: () => 'AAA',
    });

    const router = new Router({ routes: [route] });

    router.navigate(route);

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
      onRecoverableError: noop,
      wrapper: StrictMode,
    });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
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

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
    expect(renderResult.container.innerHTML).toBe('AAA');
  });

  test('redirect bubbles to the closest route with a loadingComponent', () => {
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

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, {
      onRecoverableError: noop,
      wrapper: StrictMode,
    });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
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

  test('redirect can be thrown from errorComponent', () => {
    const listenerMock = vi.fn();

    const error = new Error('Expected');

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

    const renderResult = render(<RouteOutlet controller={router.rootController!} />, { wrapper: StrictMode });

    expect(router.rootController!['_state']).toStrictEqual({ status: 'redirect', to: 'zzz' } satisfies RouteState);
    expect(renderResult.container.innerHTML).toBe('AAA');

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
});

describe('handleRouteError', () => {
  const Component = () => null;

  let listenerMock: Mock;
  let route: Route;
  let router: Router;
  let controller: RouteController;

  beforeEach(() => {
    listenerMock = vi.fn();

    route = createRoute('/aaa');
    router = new Router({ routes: [route] });
    controller = new RouteController(router, route, {});

    router.subscribe(listenerMock);
  });

  test('sets error', () => {
    const error = new Error('Expected');

    route.errorComponent = Component;

    handleRouteError(controller, error);

    expect(controller['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
  });

  test("throws if there's no errorComponent", () => {
    const error = new Error('Expected');

    expect(() => handleRouteError(controller, error)).toThrow(error);
  });

  test('throws if state is unchanged', () => {
    route.errorComponent = Component;

    const error = new Error('Expected');

    controller['_state'] = { status: 'error', error };

    expect(() => handleRouteError(controller, error)).toThrow(error);
  });
});
