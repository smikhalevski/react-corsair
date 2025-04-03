import { createRoute, Outlet, Route, RouteController, Router, RouterEvent, RouteState } from '../main';
import { getOrLoadRouteState } from '../main/RouteController';
import { AbortablePromise } from 'parallel-universe';
import { noop } from '../main/utils';

describe('RouteController', () => {
  const routeListenerMock = jest.fn();

  let route: Route;
  let router: Router;
  let controller: RouteController;

  beforeEach(() => {
    routeListenerMock.mockClear();

    route = createRoute('/foo');
    router = new Router({ routes: [route], context: { ccc: 333 } });
    controller = new RouteController(router, route, { aaa: 111 });

    router.subscribe(routeListenerMock);
  });

  test('creates a new instance', () => {
    expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
    expect(controller.loadingPromise).toBeNull();
    expect(() => controller.getData()).toThrow();
    expect(controller.getError()).toBeUndefined();
    expect(controller.params).toEqual({ aaa: 111 });
    expect(controller.router).toBe(router);
    expect(controller.route).toBe(route);
    expect(controller.context).toEqual({ ccc: 333 });
  });

  describe('notFound', () => {
    test('sets state and notifies router', () => {
      controller.notFound();

      expect(controller.state).toEqual({ status: 'not_found' } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(1);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'not_found', controller } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = new AbortablePromise<void>(noop);

      controller.loadingPromise = promise;
      controller.notFound();

      expect(controller.loadingPromise).toBeNull();
      expect(routeListenerMock).toHaveBeenCalledTimes(1);

      await expect(promise).rejects.toEqual(expect.any(DOMException));
    });
  });

  describe('redirect', () => {
    test('sets state and notifies router', () => {
      controller.redirect(route.getLocation(undefined));

      expect(controller.state).toEqual({
        status: 'redirect',
        to: { pathname: '/foo', searchParams: {}, hash: '', state: undefined },
      } satisfies RouteState);

      expect(routeListenerMock).toHaveBeenCalledTimes(1);

      expect(routeListenerMock).toHaveBeenNthCalledWith(1, {
        type: 'redirect',
        controller,
        to: { pathname: '/foo', searchParams: {}, hash: '', state: undefined },
      } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = new AbortablePromise<void>(noop);

      controller.loadingPromise = promise;
      controller.redirect(route.getLocation(undefined));

      expect(controller.loadingPromise).toBeNull();
      expect(routeListenerMock).toHaveBeenCalledTimes(1);

      await expect(promise).rejects.toEqual(expect.any(DOMException));
    });
  });

  describe('setError', () => {
    const error = new Error('Expected');

    test('sets state and notifies router', () => {
      controller.setError(error);

      expect(controller.state).toEqual({ status: 'error', error } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(1);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = new AbortablePromise<void>(noop);

      controller.loadingPromise = promise;
      controller.setError(error);

      expect(controller.loadingPromise).toBeNull();
      expect(routeListenerMock).toHaveBeenCalledTimes(1);

      await expect(promise).rejects.toEqual(expect.any(DOMException));
    });
  });

  describe('getError', () => {
    test('returns the route error', () => {
      const error = new Error('Expected');

      expect(controller.getError()).toBeUndefined();

      controller.setError(error);

      expect(controller.getError()).toBe(error);
    });
  });

  describe('setData', () => {
    const data = { bbb: 222 };

    test('sets state and notifies router', () => {
      controller.setData(data);

      expect(controller.state).toEqual({ status: 'ok', data } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(1);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = new AbortablePromise<void>(noop);

      controller.loadingPromise = promise;
      controller.setData(data);

      expect(controller.loadingPromise).toBeNull();
      expect(routeListenerMock).toHaveBeenCalledTimes(1);

      await expect(promise).rejects.toEqual(expect.any(DOMException));
    });
  });

  describe('getData', () => {
    const data = { bbb: 222 };

    test('throws if controller status is not OK', () => {
      expect(() => controller.getData()).toThrow(new Error('Route does not have loaded data'));
    });

    test('returns the route data', () => {
      controller.setData(data);

      expect(controller.getData()).toBe(data);
    });
  });

  describe('load', () => {
    const Component = () => null;

    test('synchronously sets controller state', () => {
      controller.load();

      expect(controller.loadingPromise).toBeNull();
      expect(controller.state).toEqual({ status: 'ok', data: undefined } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(1);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('loads route component and data', async () => {
      route = createRoute({
        pathname: '/foo',
        lazyComponent: () => Promise.resolve({ default: Component }),
        dataLoader: () => Promise.resolve({ zzz: 777 }),
      });

      controller = new RouteController(router, route, {});

      controller.load();

      expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(1);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      await controller.loadingPromise!.catch(noop);

      expect(controller.loadingPromise).toBeNull();
      expect(controller.state).toEqual({ status: 'ok', data: { zzz: 777 } } satisfies RouteState);
      expect(controller.route.component).toBe(Component);
      expect(routeListenerMock).toHaveBeenCalledTimes(2);
      expect(routeListenerMock).toHaveBeenNthCalledWith(2, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('preserves current OK state', async () => {
      route = createRoute({
        pathname: '/foo',
        lazyComponent: () => Promise.resolve({ default: Component }),
      });

      controller = new RouteController(router, route, {});

      controller.setData('zzz');
      controller.load();

      expect(controller.state).toEqual({ status: 'ok', data: 'zzz' } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(2);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);

      await controller.loadingPromise!.catch(noop);

      expect(controller.loadingPromise).toBeNull();
      expect(controller.state).toEqual({ status: 'ok', data: undefined } satisfies RouteState);
      expect(controller.route.component).toBe(Component);
      expect(routeListenerMock).toHaveBeenCalledTimes(3);
      expect(routeListenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('replaces current OK state with loadingAppearance', async () => {
      route = createRoute({
        pathname: '/foo',
        lazyComponent: () => Promise.resolve({ default: Component }),
        loadingAppearance: 'loading',
      });

      controller = new RouteController(router, route, {});

      controller.setData('zzz');
      controller.load();

      expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(2);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);

      await controller.loadingPromise!.catch(noop);

      expect(controller.loadingPromise).toBeNull();
      expect(controller.state).toEqual({ status: 'ok', data: undefined } satisfies RouteState);
      expect(controller.route.component).toBe(Component);
      expect(routeListenerMock).toHaveBeenCalledTimes(3);
      expect(routeListenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('replaces current non-OK state with loading', async () => {
      route = createRoute({
        pathname: '/foo',
        lazyComponent: () => Promise.resolve({ default: Component }),
        loadingAppearance: 'loading',
      });

      controller = new RouteController(router, route, {});

      controller.setError('zzz');
      controller.load();

      expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
      expect(routeListenerMock).toHaveBeenCalledTimes(2);

      expect(routeListenerMock).toHaveBeenNthCalledWith(1, {
        type: 'error',
        controller,
        error: 'zzz',
      } satisfies RouterEvent);

      expect(routeListenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);

      await controller.loadingPromise!.catch(noop);

      expect(controller.loadingPromise).toBeNull();
      expect(controller.state).toEqual({ status: 'ok', data: undefined } satisfies RouteState);
      expect(controller.route.component).toBe(Component);
      expect(routeListenerMock).toHaveBeenCalledTimes(3);
      expect(routeListenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('aborts pending route loading', async () => {
      route = createRoute({
        pathname: '/foo',
        lazyComponent: () => Promise.resolve({ default: Component }),
      });

      controller = new RouteController(router, route, {});

      controller.load();

      const promise = controller.loadingPromise;

      controller.load();

      expect(promise).not.toBeNull();
      expect(controller.loadingPromise).not.toBe(promise);
      await expect(promise).rejects.toEqual(expect.any(DOMException));
      await expect(controller.loadingPromise).resolves.toBeUndefined();

      expect(routeListenerMock).toHaveBeenCalledTimes(4);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(2, { type: 'aborted', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(3, { type: 'loading', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(4, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('triggers child controller loading', async () => {
      controller.childController = new RouteController(router, route, {});

      const loadSpy = jest.spyOn(controller.childController, 'load');

      controller.load();

      expect(loadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('abort', () => {
    test('no-op if no pending route loading', () => {
      controller.setData('zzz');
      controller.abort();

      expect(controller.state).toEqual({ status: 'ok', data: 'zzz' } satisfies RouteState);
    });

    test('aborts pending route loading and sets error state', async () => {
      route = createRoute({
        pathname: '/foo',
        dataLoader: () => Promise.resolve({ zzz: 777 }),
      });

      controller = new RouteController(router, route, {});

      controller.load();

      const promise = controller.loadingPromise;

      controller.abort('xxx');

      expect(promise).not.toBeNull();
      expect(controller.state).toEqual({ status: 'error', error: 'xxx' } satisfies RouteState);
      expect(controller.loadingPromise).toBeNull();
      await expect(promise).rejects.toEqual('xxx');
    });

    test('aborts background pending route loading and preserves state', async () => {
      route = createRoute({
        pathname: '/foo',
        dataLoader: () => Promise.resolve({ zzz: 777 }),
      });

      controller = new RouteController(router, route, {});

      controller.setData('zzz');

      controller.load();

      const promise = controller.loadingPromise;

      controller.abort('xxx');

      expect(promise).not.toBeNull();
      expect(controller.state).toEqual({ status: 'ok', data: 'zzz' } satisfies RouteState);
      expect(controller.loadingPromise).toBeNull();
      await expect(promise).rejects.toEqual('xxx');

      expect(routeListenerMock).toHaveBeenCalledTimes(3);
      expect(routeListenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);
      expect(routeListenerMock).toHaveBeenNthCalledWith(3, { type: 'aborted', controller } satisfies RouterEvent);
    });
  });

  test('aborts child controller loading', async () => {
    controller.childController = new RouteController(router, route, {});

    const abortSpy = jest.spyOn(controller.childController, 'abort');

    controller.abort();

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getOrLoadRouteState', () => {
  const Component = () => undefined;
  const { signal } = new AbortController();

  const router = new Router({ routes: [], context: undefined });

  test('returns OK state for outlet route', () => {
    const route = createRoute();

    expect(getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })).toEqual({
      status: 'ok',
      data: undefined,
    });

    expect(route.component).toBe(Outlet);
  });

  test('returns OK state for route with a component', () => {
    const route = createRoute({
      component: Component,
    });

    expect(getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })).toEqual({
      status: 'ok',
      data: undefined,
    });
  });

  test('returns OK state for route with a loader', () => {
    const route = createRoute({
      dataLoader: () => 111,
    });

    expect(getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })).toEqual({
      status: 'ok',
      data: 111,
    });
  });

  test('returns an async OK state for route with a loader', async () => {
    const route = createRoute({
      dataLoader: () => Promise.resolve(111),
    });

    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'ok',
      data: 111,
    });
  });

  test('returns an async OK for state for route with a lazy component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component }),
    });

    expect(route.component).toBeUndefined();
    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'ok',
      data: undefined,
    });
    expect(route.component).toBe(Component);
  });

  test('returns an async OK for state for route with a lazy component and loader', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component }),
      dataLoader: () => Promise.resolve(111),
    });

    expect(route.component).toBeUndefined();
    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'ok',
      data: 111,
    });
    expect(route.component).toBe(Component);
  });

  test('returns an error state if lazy component throws during load', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'error',
      error: 111,
    });
    expect(route.component).toBeUndefined();
  });

  test('returns an error state if loader throws', () => {
    const route = createRoute({
      dataLoader: () => {
        throw 111;
      },
    });

    expect(route.component).toBe(Outlet);
    expect(getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })).toEqual({
      status: 'error',
      error: 111,
    });
  });

  test('returns an error state if loader rejects', async () => {
    const route = createRoute({
      dataLoader: () => Promise.reject(111),
    });

    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'error',
      error: 111,
    });
  });

  test('returns an error state if both lazy component and loader throw', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      dataLoader: () => Promise.reject(222),
    });

    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'error',
      error: 222,
    });
  });

  test('data is ignored if lazy component loader throws', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      dataLoader: () => 'aaa',
    });

    await expect(
      getOrLoadRouteState({ route, router, params: {}, context: undefined, signal, isPrefetch: false })
    ).resolves.toEqual({
      status: 'error',
      error: 111,
    });
  });

  test('calls loader with params and context', () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      dataLoader: loaderMock,
    });

    getOrLoadRouteState({ route, router, params: { aaa: 111 }, context: { bbb: 222 }, signal, isPrefetch: false });

    expect(loaderMock).toHaveBeenCalledTimes(1);
    expect(loaderMock).toHaveBeenNthCalledWith(1, {
      route,
      router,
      params: { aaa: 111 },
      context: { bbb: 222 },
      signal,
      isPrefetch: false,
    });
  });
});
