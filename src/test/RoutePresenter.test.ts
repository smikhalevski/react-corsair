import { createRoute, Outlet } from '../main';

import { createErrorState, createOkState, loadRoute } from '../main/RoutePresenter';

const Component = () => undefined;
const { signal } = new AbortController();

describe('loadRoute', () => {
  test('returns OK state for outlet route', () => {
    const route = createRoute();

    expect(loadRoute(route, {}, undefined, signal, false)).toEqual(createOkState(undefined));
    expect(route.component).toBe(Outlet);
  });

  test('returns OK state for route with a component', () => {
    const route = createRoute({
      component: Component,
    });

    expect(loadRoute(route, {}, undefined, signal, false)).toEqual(createOkState(undefined));
  });

  test('returns OK state for route with a loader', () => {
    const route = createRoute({
      dataLoader: () => 111,
    });

    expect(loadRoute(route, {}, undefined, signal, false)).toEqual(createOkState(111));
  });

  test('returns an async OK state for route with a loader', async () => {
    const route = createRoute({
      dataLoader: () => Promise.resolve(111),
    });

    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createOkState(111));
  });

  test('returns an async OK for state for route with a lazy component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component }),
    });

    expect(route.component).toBe(undefined);
    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createOkState(undefined));
    expect(route.component).toBe(Component);
  });

  test('returns an async OK for state for route with a lazy component and loader', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component }),
      dataLoader: () => Promise.resolve(111),
    });

    expect(route.component).toBe(undefined);
    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createOkState(111));
    expect(route.component).toBe(Component);
  });

  test('returns an error state if lazy component throws during load', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createErrorState(111));
    expect(route.component).toBe(undefined);
  });

  test('returns an error state if loader throws', () => {
    const route = createRoute({
      dataLoader: () => {
        throw 111;
      },
    });

    expect(route.component).toBe(Outlet);
    expect(loadRoute(route, {}, undefined, signal, false)).toEqual(createErrorState(111));
  });

  test('returns an error state if loader rejects', async () => {
    const route = createRoute({
      dataLoader: () => Promise.reject(111),
    });

    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createErrorState(111));
  });

  test('returns an error state if both lazy component and loader throw', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      dataLoader: () => Promise.reject(222),
    });

    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createErrorState(222));
  });

  test('data is ignored if lazy component loader throws', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      dataLoader: () => 'aaa',
    });

    await expect(loadRoute(route, {}, undefined, signal, false)).resolves.toEqual(createErrorState(111));
  });

  test('calls loader with params and context', () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      dataLoader: loaderMock,
    });

    loadRoute(route, { aaa: 111 }, { bbb: 222 }, signal, false);

    expect(loaderMock).toHaveBeenCalledTimes(1);
    expect(loaderMock).toHaveBeenNthCalledWith(1, {
      params: { aaa: 111 },
      context: { bbb: 222 },
      signal,
      isPrefetch: false,
    });
  });
});
