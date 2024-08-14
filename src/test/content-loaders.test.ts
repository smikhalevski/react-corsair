import { JSDOM } from 'jsdom';
import { createRoute, Outlet } from '../main';
import {
  createErrorContent,
  createOkContent,
  hydrateRoutes,
  loadRoute,
  loadRoutes,
  loadServerRoutes,
} from '../main/content-loaders';

const Component1 = () => undefined;
const Component2 = () => undefined;

describe('loadRoutes', () => {
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
    ).toEqual([createOkContent(Component1, 'xxx'), createOkContent(Component2, 'yyy')]);

    expect(aaaLoaderMock).toHaveBeenCalledTimes(1);
    expect(aaaLoaderMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { ccc: 333 });
    expect(bbbLoaderMock).toHaveBeenCalledTimes(1);
    expect(bbbLoaderMock).toHaveBeenNthCalledWith(1, { bbb: 222 }, { ccc: 333 });
  });
});

describe('loadRoute', () => {
  test('returns OK state for outlet route', () => {
    const route = createRoute();

    expect(loadRoute({ route, params: {} }, undefined)).toEqual(createOkContent(Outlet, undefined));
  });

  test('returns OK state for route with a component', () => {
    const route = createRoute({
      component: Component1,
    });

    expect(loadRoute({ route, params: {} }, undefined)).toEqual(createOkContent(Component1, undefined));
  });

  test('returns OK state for route with a loader', () => {
    const route = createRoute({
      loader: () => 111,
    });

    expect(loadRoute({ route, params: {} }, undefined)).toEqual(createOkContent(Outlet, 111));
  });

  test('returns an async OK state for route with a loader', async () => {
    const route = createRoute({
      loader: () => Promise.resolve(111),
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createOkContent(Outlet, 111));
  });

  test('returns an async OK for state for route with a lazy component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createOkContent(Component1, undefined));
  });

  test('returns an async OK for state for route with a lazy component and loader', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component1 }),
      loader: () => Promise.resolve(111),
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createOkContent(Component1, 111));
  });

  test('returns an error state if lazy component throws during load', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createErrorContent(111));
  });

  test('returns an error state if loader throws', () => {
    const route = createRoute({
      loader: () => {
        throw 111;
      },
    });

    expect(loadRoute({ route, params: {} }, undefined)).toEqual(createErrorContent(111));
  });

  test('returns an error state if loader rejects', async () => {
    const route = createRoute({
      loader: () => Promise.reject(111),
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createErrorContent(111));
  });

  test('returns an error state if both lazy component and loader throw', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      loader: () => Promise.reject(222),
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createErrorContent(222));
  });

  test('data is ignored if lazy component loader throws', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
      loader: () => 'aaa',
    });

    await expect(loadRoute({ route, params: {} }, undefined)).resolves.toEqual(createErrorContent(111));
  });

  test('calls loader with params and context', () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      loader: loaderMock,
    });

    loadRoute({ route, params: { aaa: 111 } }, { bbb: 222 });

    expect(loaderMock).toHaveBeenCalledTimes(1);
    expect(loaderMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { bbb: 222 });
  });
});

describe('loadServerRoutes', () => {
  test('loads routes with server rendering disposition', () => {
    const loaderMock1 = jest.fn();
    const loaderMock2 = jest.fn();
    const loaderMock3 = jest.fn();

    const route1 = createRoute({ loader: loaderMock1 });
    const route2 = createRoute({ loader: loaderMock2 });
    const route3 = createRoute({ loader: loaderMock3, renderingDisposition: 'client' });

    loadServerRoutes(
      [
        { route: route1, params: {} },
        { route: route2, params: {} },
        { route: route3, params: {} },
      ],
      undefined
    );

    expect(loaderMock1).toHaveBeenCalledTimes(1);
    expect(loaderMock2).toHaveBeenCalledTimes(1);
    expect(loaderMock3).not.toHaveBeenCalled();
  });
});

describe('hydrateRoutes', () => {
  beforeEach(() => {
    const { window } = new JSDOM('', { url: 'http://localhost' });

    Object.assign(global, { window });
  });

  test('hydrates a route from an SSR state', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'aaa', hasError: false })),
    };

    expect(hydrateRoutes('xxx', [{ route, params: {} }], undefined)).toEqual([
      { component: Outlet, data: 'aaa', error: undefined, hasError: false },
    ]);
  });

  test('hydrates multiple routes from an SSR state', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map()
        .set(0, JSON.stringify({ data: 'aaa', hasError: false }))
        .set(1, JSON.stringify({ data: 'bbb', hasError: false })),
    };

    expect(
      hydrateRoutes(
        'xxx',
        [
          { route, params: {} },
          { route, params: {} },
        ],
        undefined
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

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'aaa', hasError: false })),
    };

    await expect(hydrateRoutes('xxx', [{ route, params: {} }], undefined)[0]).resolves.toEqual({
      component: Component1,
      data: 'aaa',
      error: undefined,
      hasError: false,
    });
  });

  test('returns an error state', () => {
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'IGNORED', error: 'aaa', hasError: true })),
    };

    expect(hydrateRoutes('xxx', [{ route, params: {} }], undefined)[0]).toEqual({
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

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'aaa' })),
    };

    hydrateRoutes('xxx', [{ route, params: {} }], undefined);

    expect(loaderMock).not.toHaveBeenCalled();
  });

  test('waits for a state to arrive', async () => {
    const loaderMock = jest.fn();

    const route = createRoute({
      loader: loaderMock,
    });

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map(),
    };

    const contents = hydrateRoutes('xxx', [{ route, params: {} }], undefined);

    expect(contents).toEqual([expect.any(Promise)]);

    expect(loaderMock).not.toHaveBeenCalled();

    window.__REACT_CORSAIR_SSR_STATE__.xxx.set(0, JSON.stringify({ data: 'aaa' }));

    await expect(contents[0]).resolves.toEqual({ component: Outlet, data: 'aaa', error: undefined, hasError: false });
  });

  test('loads a route on the second call', () => {
    const loaderMock = jest.fn(() => 'zzz');

    const route = createRoute({
      loader: loaderMock,
    });

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'aaa' })),
    };

    expect(hydrateRoutes('xxx', [{ route, params: {} }], undefined)).toEqual([
      {
        component: Outlet,
        data: 'aaa',
        error: undefined,
        hasError: false,
      },
    ]);
    expect(loaderMock).not.toHaveBeenCalled();

    expect(hydrateRoutes('xxx', [{ route, params: {} }], undefined)).toEqual([
      {
        component: Outlet,
        data: 'zzz',
        error: undefined,
        hasError: false,
      },
    ]);
    expect(loaderMock).toHaveBeenCalledTimes(1);
  });

  test('uses a custom state parser', () => {
    const stateParserMock = jest.fn(JSON.parse);
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'aaa' })),
    };

    hydrateRoutes('xxx', [{ route, params: {} }], undefined, stateParserMock);

    expect(stateParserMock).toHaveBeenCalledTimes(1);
    expect(stateParserMock).toHaveBeenNthCalledWith(1, '{"data":"aaa"}');
  });

  test('returns an error state when a state parser throws', () => {
    const stateParser = () => {
      throw 111;
    };
    const route = createRoute();

    window.__REACT_CORSAIR_SSR_STATE__ = {
      xxx: new Map().set(0, JSON.stringify({ data: 'aaa' })),
    };

    expect(hydrateRoutes('xxx', [{ route, params: {} }], undefined, stateParser)).toEqual([
      {
        component: undefined,
        data: undefined,
        error: 111,
        hasError: true,
      },
    ]);
  });
});
