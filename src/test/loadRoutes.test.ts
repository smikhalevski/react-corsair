import { createRoute, Outlet } from '../main';
import { hydrateRoutes, loadRoute, loadRoutes } from '../main/loadRoutes';

const Component1 = () => undefined;
const Component2 = () => undefined;

describe('loadRoute', () => {
  test('loads multiple routes', () => {
    const aaaLoaderMock = jest.fn(() => 'xxx');
    const bbbLoaderMock = jest.fn(() => 'yyy');

    const aaaRoute = createRoute({ component: Component1, loader: aaaLoaderMock });
    const bbbRoute = createRoute({ component: Component2, loader: bbbLoaderMock });

    expect(
      loadRoutes(
        [
          { route: aaaRoute, params: { aaa: 111 } },
          { route: bbbRoute, params: { bbb: 222 } },
        ],
        { ccc: 333 }
      )
    ).toEqual([
      {
        component: Component1,
        data: 'xxx',
        error: undefined,
        hasError: false,
      },
      {
        component: Component2,
        data: 'yyy',
        error: undefined,
        hasError: false,
      },
    ]);

    expect(aaaLoaderMock).toHaveBeenCalledTimes(1);
    expect(aaaLoaderMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { ccc: 333 });
    expect(bbbLoaderMock).toHaveBeenCalledTimes(1);
    expect(bbbLoaderMock).toHaveBeenNthCalledWith(1, { bbb: 222 }, { ccc: 333 });
  });
});

describe('loadRoute', () => {
  test('returns OK state for outlet route', () => {
    const route = createRoute();

    expect(loadRoute(route, {}, undefined)).toEqual({
      component: Outlet,
      data: undefined,
      error: undefined,
      hasError: false,
    });
  });

  test('returns OK state for route with a component', () => {
    const route = createRoute({
      component: Component1,
    });

    expect(loadRoute(route, {}, undefined)).toEqual({
      component: Component1,
      data: undefined,
      error: undefined,
      hasError: false,
    });
  });

  test('returns OK state for route with a loader', () => {
    const route = createRoute({
      loader: () => 111,
    });

    expect(loadRoute(route, {}, undefined)).toEqual({
      component: Outlet,
      data: 111,
      error: undefined,
      hasError: false,
    });
  });

  test('returns an async OK state for route with a loader', async () => {
    const route = createRoute({
      loader: () => Promise.resolve(111),
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: Outlet,
      data: 111,
      error: undefined,
      hasError: false,
    });
  });

  test('returns an async OK for state for route with a lazy component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: Component1,
      data: undefined,
      error: undefined,
      hasError: false,
    });
  });

  test('returns an async OK for state for route with a lazy component and loader', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
      loader: () => Promise.resolve(111),
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: Component1,
      data: 111,
      error: undefined,
      hasError: false,
    });
  });

  test('returns an error state if lazy component throws during load', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: undefined,
      data: undefined,
      error: 111,
      hasError: true,
    });
  });

  test('returns an error state if loader throws', () => {
    const route = createRoute({
      loader: () => {
        throw 111;
      },
    });

    expect(loadRoute(route, {}, undefined)).toEqual({
      component: undefined,
      data: undefined,
      error: 111,
      hasError: true,
    });
  });

  test('returns an error state if loader rejects', async () => {
    const route = createRoute({
      loader: () => Promise.reject(111),
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: undefined,
      data: undefined,
      error: 111,
      hasError: true,
    });
  });

  test('returns an error state if both lazy component and loader throw', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      loader: () => Promise.reject(222),
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: undefined,
      data: undefined,
      error: 222,
      hasError: true,
    });
  });

  test('data is ignored if lazy component loader throws', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      loader: () => 'aaa',
    });

    await expect(loadRoute(route, {}, undefined)).resolves.toEqual({
      component: undefined,
      data: undefined,
      error: 111,
      hasError: true,
    });
  });

  test('calls loader with params and context', () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      loader: loaderMock,
    });

    loadRoute(route, { aaa: 111 }, { bbb: 222 });

    expect(loaderMock).toHaveBeenCalledTimes(1);
    expect(loaderMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { bbb: 222 });
  });
});

describe('hydrateRoutes', () => {
  test('hydrates a route from an SSR state', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(0, JSON.stringify({ data: 'aaa' }));

    expect(hydrateRoutes([{ route, params: {} }], JSON.parse)).toEqual([
      { component: Outlet, data: 'aaa', error: undefined, hasError: false },
    ]);
  });

  test('hydrates multiple routes from an SSR state', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = new Map()
      .set(0, JSON.stringify({ data: 'aaa' }))
      .set(1, JSON.stringify({ data: 'bbb' }));

    expect(
      hydrateRoutes(
        [
          { route, params: {} },
          { route, params: {} },
        ],
        JSON.parse
      )
    ).toEqual([
      { component: Outlet, data: 'aaa', error: undefined, hasError: false },
      { component: Outlet, data: 'bbb', error: undefined, hasError: false },
    ]);
  });

  test('loads a component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
    });

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(0, JSON.stringify({ data: 'aaa' }));

    await expect(hydrateRoutes([{ route, params: {} }], JSON.parse)![0]).resolves.toEqual({
      component: Component1,
      data: 'aaa',
      error: undefined,
      hasError: false,
    });
  });

  test('returns an error state', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(
      0,
      JSON.stringify({ data: 'IGNORED', error: 'aaa', hasError: true })
    );

    expect(hydrateRoutes([{ route, params: {} }], JSON.parse)![0]).toEqual({
      component: undefined,
      data: undefined,
      error: 'aaa',
      hasError: true,
    });
  });

  test('does not call a loader during hydration', () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      loader: loaderMock,
    });

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(0, JSON.stringify({ data: 'aaa' }));

    hydrateRoutes([{ route, params: {} }], JSON.parse);

    expect(loaderMock).not.toHaveBeenCalled();
  });

  test('waits for a state to arrive', async () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      loader: loaderMock,
    });

    window.__REACT_CORSAIR_SSR_STATE__ = new Map();

    const contents = hydrateRoutes([{ route, params: {} }], JSON.parse);

    expect(contents).toEqual([expect.any(Promise)]);

    expect(loaderMock).not.toHaveBeenCalled();

    window.__REACT_CORSAIR_SSR_STATE__.set(0, JSON.stringify({ data: 'aaa' }));

    await expect(contents![0]).resolves.toEqual({ component: Outlet, data: 'aaa', error: undefined, hasError: false });
  });

  test('does not hydrate the second call', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(0, JSON.stringify({ data: 'aaa' }));

    expect(hydrateRoutes([{ route, params: {} }], JSON.parse)).toBeInstanceOf(Array);
    expect(hydrateRoutes([{ route, params: {} }], JSON.parse)).toBeNull();
    expect(window.__REACT_CORSAIR_SSR_STATE__).toBe(undefined);
  });

  test('uses a custom state parser', () => {
    const stateParserMock = jest.fn(JSON.parse);
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(0, JSON.stringify({ data: 'aaa' }));

    hydrateRoutes([{ route, params: {} }], stateParserMock);

    expect(stateParserMock).toHaveBeenCalledTimes(1);
    expect(stateParserMock).toHaveBeenNthCalledWith(1, '{"data":"aaa"}');
  });

  test('returns an error state when a state parser throws', () => {
    const stateParser = () => {
      throw 111;
    };
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = new Map().set(0, JSON.stringify({ data: 'aaa' }));

    expect(hydrateRoutes([{ route, params: {} }], stateParser)).toEqual([
      {
        component: undefined,
        data: undefined,
        error: 111,
        hasError: true,
      },
    ]);
  });
});
