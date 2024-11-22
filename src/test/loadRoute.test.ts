import { createRoute, Outlet } from '../main';
import { createErrorPayload, createOkPayload, loadRoute } from '../main/loadRoute';
import { LoaderOptions } from '../main/types';

const Component1 = () => undefined;
const Component2 = () => undefined;

describe('loadRoute', () => {
  test('returns OK state for outlet route', () => {
    const route = createRoute();

    expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).toEqual(createOkPayload(undefined));
  });

  test('returns OK state for route with a component', () => {
    const route = createRoute({
      component: Component1,
    });

    expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).toEqual(createOkPayload(undefined));
  });

  test('returns OK state for route with a loader', () => {
    const route = createRoute({
      loader: () => 111,
    });

    expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).toEqual(createOkPayload(111));
  });

  test('returns an async OK state for route with a loader', async () => {
    const route = createRoute({
      loader: () => Promise.resolve(111),
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createOkPayload(111)
    );
  });

  test('returns an async OK for state for route with a lazy component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createOkPayload(undefined)
    );
  });

  test('returns an async OK for state for route with a lazy component and loader', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
      loader: () => Promise.resolve(111),
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createOkPayload(111)
    );
  });

  test('returns an error state if lazy component throws during load', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createErrorPayload(111)
    );
  });

  test('returns an error state if loader throws', () => {
    const route = createRoute({
      loader: () => {
        throw 111;
      },
    });

    expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).toEqual(createErrorPayload(111));
  });

  test('returns an error state if loader rejects', async () => {
    const route = createRoute({
      loader: () => Promise.reject(111),
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createErrorPayload(111)
    );
  });

  test('returns an error state if both lazy component and loader throw', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      loader: () => Promise.reject(222),
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createErrorPayload(222)
    );
  });

  test('data is ignored if lazy component loader throws', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      loader: () => 'aaa',
    });

    await expect(loadRoute(route, { params: {}, context: undefined, isPreload: false })).resolves.toEqual(
      createErrorPayload(111)
    );
  });

  test('calls loader with params and context', () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      loader: loaderMock,
    });

    const loaderOptions: LoaderOptions = { params: { aaa: 111 }, context: { bbb: 222 }, isPreload: false };

    loadRoute(route, loaderOptions);

    expect(loaderMock).toHaveBeenCalledTimes(1);
    expect(loaderMock).toHaveBeenNthCalledWith(1, loaderOptions);
  });
});
