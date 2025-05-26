import { describe, beforeEach, test, expect, vi, Mock } from 'vitest';
import {
  createRoute,
  DataLoaderOptions,
  Outlet,
  Route,
  RouteController,
  Router,
  RouterEvent,
  RouteState,
} from '../main/index.js';
import { AbortError, noop } from '../main/utils.js';
import { AbortablePromise } from 'parallel-universe';
import { handleBoundaryError, reconcileControllers } from '../main/RouteController.js';
import { matchRoutes } from '../main/matchRoutes.js';

describe('RouteController', () => {
  let listenerMock: Mock;
  let route: Route;
  let router: Router;
  let controller: RouteController;

  beforeEach(() => {
    listenerMock = vi.fn();

    route = createRoute('/aaa');
    router = new Router({ routes: [route], context: { xxx: 111 } });
    controller = new RouteController(router, route, { yyy: 222 });

    router.subscribe(listenerMock);
  });

  test('creates a new instance', () => {
    expect(controller.parentController).toBeNull();
    expect(controller.childController).toBeNull();
    expect(controller.promise).toBeNull();
    expect(controller.router).toBe(router);
    expect(controller.route).toBe(route);
    expect(controller.params).toEqual({ yyy: 222 });

    expect(controller['_fallbackController']).toBeNull();
    expect(controller['_context']).toBeUndefined();
    expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller['_error']).toBeUndefined();
    expect(controller['_renderedState']).toBeUndefined();
  });

  describe('_load', () => {
    const Component = () => null;

    test('synchronously loads data', () => {
      const dataLoaderMock = vi.fn(_options => 'zzz');

      controller['_load'](dataLoaderMock);

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Outlet);
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('synchronously sets error', () => {
      const error = new Error('Expected');

      const dataLoaderMock = vi.fn(_options => {
        throw error;
      });

      controller['_load'](dataLoaderMock);

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Outlet);
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
    });

    test('asynchronously loads data', async () => {
      const dataLoaderMock = vi.fn(_options => Promise.resolve('zzz'));

      const promise = controller['_load'](dataLoaderMock);

      expect(controller.promise).not.toBeNull();
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      await promise;

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Outlet);
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('asynchronously loads component', async () => {
      const lazyComponentMock = vi.fn(() => Promise.resolve({ default: Component }));

      const route = createRoute({ lazyComponent: lazyComponentMock });

      controller = new RouteController(router, route, {});

      const promise = controller['_load'](noop);

      expect(controller.promise).not.toBeNull();
      expect(controller.route.component).toBeUndefined();
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      await promise;

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Component);
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: undefined } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('asynchronously loads component and data', async () => {
      const lazyComponentMock = vi.fn(() => Promise.resolve({ default: Component }));
      const dataLoaderMock = vi.fn(_options => Promise.resolve('zzz'));

      const route = createRoute({ lazyComponent: lazyComponentMock });

      controller = new RouteController(router, route, {});

      const promise = controller['_load'](dataLoaderMock);

      expect(controller.promise).not.toBeNull();
      expect(controller.route.component).toBeUndefined();
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      await promise;

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Component);
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('asynchronously sets error', async () => {
      const error = new Error('Expected');
      const dataLoaderMock = vi.fn(_options => Promise.reject(error));

      const promise = controller['_load'](dataLoaderMock);

      expect(controller.promise).not.toBeNull();
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      await expect(promise).rejects.toBe(error);

      expect(controller.promise).toBeNull();
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'error', controller, error } satisfies RouterEvent);
    });

    test('preserves current ready state', async () => {
      const dataLoaderMock = vi.fn(_options => Promise.resolve('zzz'));

      controller['_load'](() => 'ttt');

      const promise = controller['_load'](dataLoaderMock);

      expect(controller.promise).not.toBeNull();
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'ttt' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);

      await promise;

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Outlet);
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('replaces current ready state with loadingAppearance', async () => {
      const dataLoaderMock = vi.fn(_options => Promise.resolve('zzz'));

      const route = createRoute({ loadingAppearance: 'loading' });

      controller = new RouteController(router, route, {});

      controller['_load'](() => 'ttt');

      const promise = controller['_load'](dataLoaderMock);

      expect(controller.promise).not.toBeNull();
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);

      await promise;

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Outlet);
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('replaces current non-ready state with loading', async () => {
      const error = new Error('Expected');
      const dataLoaderMock = vi.fn(_options => Promise.resolve('zzz'));

      controller['_load'](() => {
        throw error;
      });

      const promise = controller['_load'](dataLoaderMock);

      expect(controller.promise).not.toBeNull();
      expect(controller['_context']).toBeUndefined();
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);

      await promise;

      expect(controller.promise).toBeNull();
      expect(controller.route.component).toBe(Outlet);
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('aborts the pending route loading', async () => {
      const dataLoaderMock1 = vi.fn(_options => Promise.resolve('zzz'));

      const promise1 = controller['_load'](dataLoaderMock1);
      const promise2 = controller['_load'](() => 'ttt');

      expect(controller.promise).toBeNull();
      expect(controller['_context']).toStrictEqual({ xxx: 111 });
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'ttt' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'aborted', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'ready', controller } satisfies RouterEvent);

      await expect(promise1).rejects.toEqual(AbortError('The route loading was aborted'));
      await expect(promise2).resolves.toEqual('ttt');
    });
  });

  describe('notFound', () => {
    test('sets state and notifies router', () => {
      controller.notFound();

      expect(controller['_state']).toStrictEqual({ status: 'not_found' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'not_found', controller } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = controller['_load'](() => Promise.resolve('zzz'));

      controller.notFound();

      expect(controller.promise).toBeNull();
      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'aborted', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'not_found', controller } satisfies RouterEvent);

      await expect(promise).rejects.toStrictEqual(AbortError('The route loading was aborted'));
    });
  });

  describe('redirect', () => {
    test('sets state and notifies router', () => {
      controller.redirect(route.getLocation(undefined));

      expect(controller['_state']).toStrictEqual({
        status: 'redirect',
        to: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
      } satisfies RouteState);

      expect(listenerMock).toHaveBeenCalledTimes(1);

      expect(listenerMock).toHaveBeenNthCalledWith(1, {
        type: 'redirect',
        controller,
        to: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
      } satisfies RouterEvent);
    });
  });

  describe('setError', () => {
    const error = new Error('Expected');

    test('sets state and notifies router', () => {
      controller.setError(error);

      expect(controller['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = controller['_load'](() => Promise.resolve('zzz'));

      controller.setError(error);

      expect(controller.promise).toBeNull();
      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'aborted', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'error', controller, error } satisfies RouterEvent);

      await expect(promise).rejects.toStrictEqual(AbortError('The route loading was aborted'));
    });
  });

  describe('setData', () => {
    test('synchronously sets the ready state and notifies router', () => {
      controller.setData('zzz');

      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('asynchronously sets the ready state and notifies router', async () => {
      controller.setData(Promise.resolve('zzz'));

      expect(controller.promise).not.toBeNull();
      expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      await controller.promise;

      expect(controller.promise).toBeNull();
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(2);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'ready', controller } satisfies RouterEvent);
    });

    test('aborts loading promise', async () => {
      const promise = new AbortablePromise<void>(noop);

      controller.promise = promise;
      controller.setData('zzz');

      expect(controller.promise).toBeNull();
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);

      await expect(promise).rejects.toStrictEqual(AbortError('The route loading was aborted'));
    });
  });

  describe('abort', () => {
    test('no-op if no pending route loading', () => {
      controller['_load'](() => 'zzz');
      controller.abort();

      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
    });

    test('aborts pending route loading and sets error state', async () => {
      controller['_load'](() => Promise.resolve({ zzz: 777 }));

      const promise = controller.promise;

      controller.abort('xxx');

      expect(controller['_state']).toStrictEqual({ status: 'error', error: 'xxx' } satisfies RouteState);
      expect(controller.promise).toBeNull();
      await expect(promise).rejects.toStrictEqual('xxx');

      expect(listenerMock).toHaveBeenCalledTimes(2);

      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'loading', controller } satisfies RouterEvent);

      expect(listenerMock).toHaveBeenNthCalledWith(2, {
        type: 'error',
        controller,
        error: 'xxx',
      } satisfies RouterEvent);
    });

    test('aborts background pending route loading and preserves state', async () => {
      controller['_load'](() => 'aaa');
      controller['_load'](() => Promise.resolve('bbb'));

      const promise = controller.promise;

      controller.abort('ccc');

      expect(promise).not.toBeNull();
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'aaa' } satisfies RouteState);
      expect(controller.promise).toBeNull();

      expect(listenerMock).toHaveBeenCalledTimes(3);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'loading', controller } satisfies RouterEvent);
      expect(listenerMock).toHaveBeenNthCalledWith(3, { type: 'aborted', controller } satisfies RouterEvent);

      await expect(promise).rejects.toBe('ccc');
    });
  });

  describe('status', () => {
    test('returns the current status', () => {
      expect(controller.status).toBe('loading');

      controller['_load'](() => 'aaa');

      expect(controller.status).toBe('ready');
    });
  });

  describe('data', () => {
    test('returns the data if status is ready', () => {
      controller['_load'](() => 'aaa');

      expect(controller.data).toBe('aaa');
    });

    test("throws if state if there's no data", () => {
      expect(() => controller.data).toThrow(new Error("The route data isn't ready"));
    });
  });

  describe('error', () => {
    test('returns the current error', () => {
      const error = new Error('Expected');

      expect(controller.error).toBeUndefined();

      controller.setError(error);

      expect(controller.error).toBe(error);
    });
  });

  describe('reload', () => {
    test('loads using route dataLoader', () => {
      const dataLoaderMock = vi.fn(_options => 'zzz');

      const route = createRoute({ dataLoader: dataLoaderMock });
      controller = new RouteController(router, route, {});

      controller.reload();

      expect(controller.promise).toBeNull();
      expect(controller['_state']).toStrictEqual({ status: 'ready', data: 'zzz' } satisfies RouteState);
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'ready', controller } satisfies RouterEvent);
      expect(dataLoaderMock).toHaveBeenCalledTimes(1);
      expect(dataLoaderMock).toHaveBeenNthCalledWith(1, {
        router,
        route,
        params: {},
        signal: expect.any(AbortSignal),
        isPrefetch: false,
      } satisfies DataLoaderOptions<any, any>);
    });
  });
});

describe('handleBoundaryError', () => {
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
    controller['_renderedState'] = { status: 'loading' };

    handleBoundaryError(controller, error);

    expect(controller['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
  });

  test('ignores if called multiple times with the same error', () => {
    const error = new Error('Expected');

    route.errorComponent = Component;
    controller['_renderedState'] = { status: 'loading' };

    handleBoundaryError(controller, error);
    handleBoundaryError(controller, error);
    handleBoundaryError(controller, error);

    expect(controller['_state']).toStrictEqual({ status: 'error', error } satisfies RouteState);
    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error } satisfies RouterEvent);
  });

  test('overwrites previous error', () => {
    const error1 = new Error('Expected1');
    const error2 = new Error('Expected2');

    route.errorComponent = Component;
    controller['_renderedState'] = { status: 'loading' };

    handleBoundaryError(controller, error1);
    handleBoundaryError(controller, error2);

    expect(controller['_state']).toStrictEqual({ status: 'error', error: error2 } satisfies RouteState);
    expect(listenerMock).toHaveBeenCalledTimes(2);
    expect(listenerMock).toHaveBeenNthCalledWith(1, { type: 'error', controller, error: error1 } satisfies RouterEvent);
    expect(listenerMock).toHaveBeenNthCalledWith(2, { type: 'error', controller, error: error2 } satisfies RouterEvent);
  });

  test("throws if there's no errorComponent", () => {
    const error = new Error('Expected');

    controller['_renderedState'] = { status: 'loading' };

    expect(() => handleBoundaryError(controller, error)).toThrow(error);
  });

  test('throws if state is unchanged', () => {
    route.errorComponent = Component;

    const error = new Error('Expected');

    controller['_renderedState'] = { status: 'error', error };

    expect(() => handleBoundaryError(controller, error)).toThrow(error);
  });
});

describe('reconcileControllers', () => {
  test('returns null for empty matches', () => {
    const router = new Router({ routes: [] });

    const controller = reconcileControllers(router, router.rootController, []);

    expect(controller).toBeNull();
  });

  test('reuses ready state if nothing is changed', () => {
    const route = createRoute('/aaa');

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1.reload();

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 222 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).toBe(controller1['_state']);
    expect(controller2['_error']).toBe(controller1['_error']);
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBeNull();
  });

  test('does not reuse error state if nothing is changed', () => {
    const route = createRoute('/aaa');

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1['_load'](() => {
      throw new Error('Expected');
    });

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 222 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).not.toBe(controller1['_state']);
    expect(controller2['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller2['_error']).toBeUndefined();
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBeNull();
  });

  test('does not reuse loading state if nothing is changed', () => {
    const route = createRoute({
      dataLoader: () => Promise.resolve('ttt'),
    });

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1.reload();

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 222 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).not.toBe(controller1['_state']);
    expect(controller2['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller2['_error']).toBe(controller1['_error']);
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBeNull();
  });

  test("reuses ready state if params have changed but there's no dataLoader", () => {
    const route = createRoute('/aaa');

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1.reload();

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { zzz: 333 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).toBe(controller1['_state']);
    expect(controller2['_error']).toBe(controller1['_error']);
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBeNull();
  });

  test('uses the evicted controller as a fallback if params have changed', () => {
    const route = createRoute({ dataLoader: () => 'zzz' });

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1.reload();

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 333 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).not.toBe(controller1['_state']);
    expect(controller2['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller2['_error']).toBe(controller1['_error']);
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBe(controller1);
  });

  test('uses the evicted controller as a fallback if context has changed', () => {
    const route = createRoute({ dataLoader: () => 'zzz' });

    const router = new Router({ routes: [], context: 'ppp' });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1.reload();

    router.context = 'qqq';

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 222 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).not.toBe(controller1['_context']);
    expect(controller2['_context']).toBeUndefined();
    expect(controller2['_state']).not.toBe(controller1['_state']);
    expect(controller2['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller2['_error']).toBe(controller1['_error']);
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBe(controller1);
  });

  test('does not use the evicted controller as a fallback if its state is not ready and params have changed', () => {
    const route = createRoute({ dataLoader: () => 'zzz' });

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1['_load'](() => {
      throw new Error('Expected');
    });

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 333 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).not.toBe(controller1['_state']);
    expect(controller2['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller2['_error']).toBeUndefined();
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBeNull();
  });

  test('does not use the evicted controller as a fallback if loadingAppearance is loading', () => {
    const route = createRoute({
      dataLoader: () => 'zzz',
      loadingAppearance: 'loading',
    });

    const router = new Router({ routes: [] });

    const controller1 = new RouteController(router, route, { yyy: 222 });
    controller1.reload();

    const controller2 = reconcileControllers(router, controller1, [{ route, params: { yyy: 333 } }])!;

    expect(controller2).not.toBe(controller1);
    expect(controller2['_context']).toBe(controller1['_context']);
    expect(controller2['_state']).not.toBe(controller1['_state']);
    expect(controller2['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller2['_error']).toBeUndefined();
    expect(controller2['_renderedState']).toBe(controller1['_renderedState']);
    expect(controller2['_fallbackController']).toBeNull();
  });

  test('uses the evicted controller as a fallback if route has changed and loadingAppearance is avoid', () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute({
      pathname: '/bbb',
      loadingAppearance: 'avoid',
    });

    const router = new Router({ routes: [] });

    router.rootController = new RouteController(router, routeAaa, {});

    router.rootController.setData('aaa');

    const controller = reconcileControllers(router, router.rootController, [{ route: routeBbb, params: {} }])!;

    expect(controller['_state']).not.toBe(router.rootController['_state']);
    expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller.route).toBe(routeBbb);
    expect(controller['_fallbackController']).toBe(router.rootController);
  });

  test('does not use the evicted controller as a fallback if route has changed and loadingAppearance is route_loading', () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute({
      pathname: '/bbb',
      loadingAppearance: 'route_loading',
    });

    const router = new Router({ routes: [] });

    router.rootController = new RouteController(router, routeAaa, {});

    router.rootController.setData('aaa');

    const controller = reconcileControllers(router, router.rootController, [{ route: routeBbb, params: {} }])!;

    expect(controller['_state']).not.toBe(router.rootController['_state']);
    expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller.route).toBe(routeBbb);
    expect(controller['_fallbackController']).toBeNull();
  });

  test('does not use the evicted controller as a fallback if route has changed and its state is not ready', () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute({ loadingAppearance: 'avoid' });

    const router = new Router({ routes: [] });

    router.rootController = new RouteController(router, routeAaa, {});

    router.rootController.setError('xxx');

    const controller = reconcileControllers(router, router.rootController, [{ route: routeBbb, params: {} }])!;

    expect(controller['_state']).not.toBe(router.rootController['_state']);
    expect(controller['_state']).toStrictEqual({ status: 'loading' } satisfies RouteState);
    expect(controller.route).toBe(routeBbb);
    expect(controller['_fallbackController']).toBeNull();
  });

  test('uses the evicted controller as a fallback for a nested route', () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute(routeAaa, '/bbb');
    const routeCcc = createRoute(routeAaa, {
      pathname: '/ccc',
      loadingAppearance: 'avoid',
    });

    const router = new Router({ routes: [routeBbb] });

    router.navigate(routeBbb);

    const evictedController = router.rootController;

    const routeMatches = matchRoutes('/aaa/ccc', {}, [routeCcc]);

    const controller = reconcileControllers(router, router.rootController, routeMatches)!;

    expect(controller['_state'].status).toBe('ready');
    expect(controller.route).toBe(routeAaa);
    expect(controller['_fallbackController']).toBeNull();
    expect(controller.childController!['_state'].status).toBe('loading');
    expect(controller.childController!.route).toBe(routeCcc);
    expect(controller.childController!['_fallbackController']).toBe(evictedController!.childController);
  });
});
