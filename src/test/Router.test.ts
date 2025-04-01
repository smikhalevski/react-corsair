import { createRoute, Route, Router } from '../main';
import { AbortablePromise } from 'parallel-universe';

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
  expect(router.rootController).toBe(null);
  expect(router.errorComponent).toBe(errorComponent);
  expect(router.loadingComponent).toBe(loadingComponent);
  expect(router.notFoundComponent).toBe(notFoundComponent);
});

describe('navigate', () => {
  test('navigates router to a location', () => {
    const listenerMock = jest.fn();

    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb], context: undefined });

    router.subscribe(listenerMock);

    router.navigate(routeAaa);

    expect(router.rootController!.route).toBe(routeAaa);
    expect(router.location).toStrictEqual({ pathname: '/aaa', searchParams: {}, hash: '', state: undefined });
    expect(listenerMock).toHaveBeenCalledTimes(2);
    expect(listenerMock).toHaveBeenNthCalledWith(1, {
      type: 'navigate',
      controller: router.rootController,
      router,
      location: { pathname: '/aaa', searchParams: {}, hash: '', state: undefined },
    });
    expect(listenerMock).toHaveBeenNthCalledWith(2, {
      type: 'ready',
      controller: router.rootController,
    });

    router.navigate(routeBbb.getLocation({ xxx: 111 }));

    expect(router.rootController!.route).toBe(routeBbb);
    expect(router.location).toStrictEqual({
      pathname: '/bbb',
      searchParams: { xxx: 111 },
      hash: '',
      state: undefined,
    });
    expect(listenerMock).toHaveBeenCalledTimes(4);
    expect(listenerMock).toHaveBeenNthCalledWith(3, {
      type: 'navigate',
      controller: router.rootController,
      router,
      location: { pathname: '/bbb', searchParams: { xxx: 111 }, hash: '', state: undefined },
    });
    expect(listenerMock).toHaveBeenNthCalledWith(4, {
      type: 'ready',
      controller: router.rootController,
    });
  });

  test('starts data loading', () => {
    const dataLoaderMock = jest.fn();

    const route = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const router = new Router({ routes: [route], context: 'xxx' });

    router.navigate(route);

    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock).toHaveBeenNthCalledWith(1, {
      context: 'xxx',
      isPrefetch: false,
      params: {},
      signal: expect.any(AbortSignal),
    });
  });

  test('does not start data loading if navigation was superseded', () => {
    const dataLoaderMock = jest.fn();

    const routeAaa = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const routeBbb = createRoute('/bbb');

    const router = new Router({ routes: [routeAaa, routeBbb], context: undefined });

    router.subscribe(event => {
      if (event.type === 'navigate' && event.controller!.route === routeAaa) {
        event.router.navigate(routeBbb);
      }
    });

    router.navigate(routeAaa);

    expect(dataLoaderMock).not.toHaveBeenCalled();
    expect(router.rootController!.route).toBe(routeBbb);
  });
});

describe('prefetch', () => {
  test('prefetches route', async () => {
    const listenerMock = jest.fn();
    const componentModule = { default: () => null };
    const lazyComponentMock = jest.fn(() => Promise.resolve(componentModule));
    const dataLoaderMock = jest.fn();

    const route = createRoute({
      pathname: '/aaa',
      lazyComponent: lazyComponentMock,
      dataLoader: dataLoaderMock,
    });

    expect(route.component).toBeUndefined();

    const router = new Router({ routes: [route], context: undefined });

    router.subscribe(listenerMock);

    const promise = router.prefetch(route.getLocation({ xxx: 111 }));

    expect(promise).toBeInstanceOf(AbortablePromise);

    await promise;

    expect(listenerMock).not.toHaveBeenCalled();
    expect(lazyComponentMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock).toHaveBeenNthCalledWith(1, {
      context: undefined,
      isPrefetch: true,
      params: { xxx: 111 },
      signal: expect.any(AbortSignal),
    });

    expect(route.component).toBe(componentModule.default);
  });

  test('aborts prefetch', async () => {
    const dataLoaderMock = jest.fn();

    const route = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const router = new Router({ routes: [route], context: undefined });

    router.prefetch(route.getLocation({ xxx: 111 })).abort();

    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
    expect(dataLoaderMock.mock.calls[0][0].signal.aborted).toBe(true);
  });
});
