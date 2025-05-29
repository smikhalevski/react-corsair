/**
 * @vitest-environment jsdom
 */

import { describe, expect, test, vi } from 'vitest';
import { createRoute, DataLoaderOptions, Route, Router, RouterEvent } from '../main/index.js';
import { AbortablePromise, delay } from 'parallel-universe';

test('creates a new router instance', () => {
  const routes: Route[] = [];
  const context = {};
  const errorComponent = () => null;
  const loadingComponent = () => null;
  const notFoundComponent = () => null;

  const router = new Router({
    routes,
    context,
    errorComponent,
    loadingComponent,
    notFoundComponent,
  });

  expect(router.routes).toBe(routes);
  expect(router.context).toBe(context);
  expect(router.rootController).toBeNull();
  expect(router.errorComponent).toBe(errorComponent);
  expect(router.loadingComponent).toBe(loadingComponent);
  expect(router.notFoundComponent).toBe(notFoundComponent);
});

describe('navigate', () => {
  test('navigates router to a location', () => {
    const listenerMock = vi.fn();

    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    router.subscribe(listenerMock);

    router.navigate(routeAaa);

    expect(router.rootController!.route).toBe(routeAaa);
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

    router.navigate(routeBbb.getLocation({ xxx: 111 }));

    expect(router.rootController!.route).toBe(routeBbb);

    expect(listenerMock).toHaveBeenCalledTimes(4);

    expect(listenerMock).toHaveBeenNthCalledWith(3, {
      type: 'navigate',
      controller: router.rootController,
      router,
      location: { pathname: '/bbb', searchParams: { xxx: 111 }, hash: '', state: undefined },
      isIntercepted: false,
    } satisfies RouterEvent);

    expect(listenerMock).toHaveBeenNthCalledWith(4, {
      type: 'ready',
      controller: router.rootController!,
    } satisfies RouterEvent);
  });

  test('starts data loading', () => {
    const dataLoaderMock = vi.fn();

    const route = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const router = new Router({ routes: [route] });

    router.navigate(route);

    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock).toHaveBeenNthCalledWith(1, {
      route,
      router,
      params: {},
      signal: expect.any(AbortSignal),
      isPrefetch: false,
    } satisfies DataLoaderOptions<any, any>);
  });

  test('does not start data loading if navigation was superseded', () => {
    const dataLoaderMock = vi.fn();

    const routeAaa = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    router.subscribe(event => {
      if (event.type === 'navigate' && event.controller!.route === routeAaa) {
        event.router.navigate(routeBbb);
      }
    });

    router.navigate(routeAaa);

    expect(dataLoaderMock).not.toHaveBeenCalled();
    expect(router.rootController!.route).toBe(routeBbb);
  });

  test('intercepts a route', () => {
    const listenerMock = vi.fn();

    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    router.subscribe(listenerMock);

    router['_registerInterceptedRoute'](routeBbb);

    router.navigate(routeAaa);

    expect(router.rootController!.route).toBe(routeAaa);
    expect(router.interceptedController).toBeNull();

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

    router.navigate(routeBbb);

    expect(router.rootController!.route).toBe(routeAaa);
    expect(router.interceptedController!.route).toBe(routeBbb);

    expect(listenerMock).toHaveBeenCalledTimes(4);

    expect(listenerMock).toHaveBeenNthCalledWith(3, {
      type: 'navigate',
      controller: router.interceptedController,
      router,
      location: { pathname: '/bbb', searchParams: {}, hash: '', state: undefined },
      isIntercepted: true,
    } satisfies RouterEvent);

    expect(listenerMock).toHaveBeenNthCalledWith(4, {
      type: 'ready',
      controller: router.interceptedController!,
    } satisfies RouterEvent);
  });

  test('bypasses route interception', () => {
    const listenerMock = vi.fn();

    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    router.subscribe(listenerMock);

    router['_registerInterceptedRoute'](routeBbb);

    router.navigate(routeAaa);
    router.navigate(routeBbb, { isInterceptionBypassed: true });

    expect(router.rootController!.route).toBe(routeBbb);
    expect(router.interceptedController).toBeNull();

    expect(listenerMock).toHaveBeenCalledTimes(4);

    expect(listenerMock).toHaveBeenNthCalledWith(3, {
      type: 'navigate',
      controller: router.rootController,
      router,
      location: { pathname: '/bbb', searchParams: {}, hash: '', state: undefined },
      isIntercepted: false,
    } satisfies RouterEvent);

    expect(listenerMock).toHaveBeenNthCalledWith(4, {
      type: 'ready',
      controller: router.rootController!,
    } satisfies RouterEvent);
  });
});

describe('prefetch', () => {
  test('prefetches route', async () => {
    const listenerMock = vi.fn();
    const componentModule = { default: () => null };
    const lazyComponentMock = vi.fn(() => Promise.resolve(componentModule));
    const dataLoaderMock = vi.fn();

    const route = createRoute({
      pathname: '/aaa',
      lazyComponent: lazyComponentMock,
      dataLoader: dataLoaderMock,
    });

    expect(route.component).toBeUndefined();

    const router = new Router({ routes: [route] });

    router.subscribe(listenerMock);

    const promise = router.prefetch(route.getLocation({ xxx: 111 }));

    expect(promise).toBeInstanceOf(AbortablePromise);

    await promise;

    expect(listenerMock).not.toHaveBeenCalled();
    expect(lazyComponentMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock).toHaveBeenNthCalledWith(1, {
      route,
      router,
      context: undefined,
      isPrefetch: true,
      params: { xxx: 111 },
      signal: expect.any(AbortSignal),
    });

    expect(route.component).toBe(componentModule.default);
  });

  test('aborts prefetch', async () => {
    const dataLoaderMock = vi.fn();

    const route = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const router = new Router({ routes: [route] });

    router.prefetch(route.getLocation({ xxx: 111 })).abort();

    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock.mock.calls[0][0].signal.aborted).toBe(true);
  });
});

describe('_registerInterceptedRoute', () => {
  test('unregisters only once', () => {
    const route = createRoute('/aaa');

    const router = new Router({ routes: [route] });

    const unregister0 = router['_registerInterceptedRoute'](route);
    const unregister1 = router['_registerInterceptedRoute'](route);

    expect(router['_interceptedRoutes']).toEqual([route, route]);

    unregister0();
    expect(router['_interceptedRoutes']).toEqual([route]);

    unregister0();
    expect(router['_interceptedRoutes']).toEqual([route]);

    unregister1();
    expect(router['_interceptedRoutes']).toEqual([]);
  });

  test('cancels interception if all interceptors were unregistered', () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    const unregister = router['_registerInterceptedRoute'](routeBbb);

    router.navigate(routeAaa);
    router.navigate(routeBbb);

    expect(router.rootController!.route).toBe(routeAaa);
    expect(router.interceptedController!.route).toBe(routeBbb);

    unregister();

    expect(router.rootController!.route).toBe(routeBbb);
    expect(router.interceptedController).toBeNull();
  });
});

describe('cancelInterception', () => {
  test('cancels interception', () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    router['_registerInterceptedRoute'](routeBbb);

    router.navigate(routeAaa);
    router.navigate(routeBbb);

    router.cancelInterception();

    expect(router.rootController!.route).toBe(routeBbb);
    expect(router.interceptedController).toBeNull();
  });

  test('no-op if there is no interceptedController', () => {
    const route = createRoute('/aaa');

    const router = new Router({ routes: [route] });

    router.navigate(route);

    router.cancelInterception();

    expect(router.rootController!.route).toBe(route);
    expect(router.interceptedController).toBeNull();
  });

  test('aborts rootController', () => {
    const dataLoaderMock = vi.fn(_options => delay(50));

    const routeAaa = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb] });

    router['_registerInterceptedRoute'](routeBbb);

    router.navigate(routeAaa);
    router.navigate(routeBbb);

    router.cancelInterception();

    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock.mock.calls[0][0].signal.aborted).toBe(true);
  });
});
