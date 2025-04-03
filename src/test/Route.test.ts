import { createRoute, Outlet, ParamsAdapter } from '../main';

const Component = () => null;

describe('new', () => {
  test('creates an outlet route', () => {
    expect(createRoute().component).toBe(Outlet);
  });

  test('throws if both component and lazyComponent are provided', () => {
    expect(() =>
      createRoute({
        component: Component,
        lazyComponent: () => Promise.resolve({ default: Component }),
      })
    ).toThrow(new Error('Route must have either a component or a lazyComponent'));
  });
});

describe('getLocation', () => {
  test('returns a location', () => {
    const aaaRoute = createRoute('/aaa');
    const bbbRoute = createRoute(aaaRoute, '/bbb');
    const cccRoute = createRoute(bbbRoute, '/ccc');

    expect(aaaRoute.getLocation()).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(bbbRoute.getLocation()).toEqual({ pathname: '/aaa/bbb', searchParams: {}, hash: '' });
    expect(cccRoute.getLocation()).toEqual({ pathname: '/aaa/bbb/ccc', searchParams: {}, hash: '' });

    expect(createRoute('aaa').getLocation()).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
    expect(createRoute('aaa/').getLocation()).toEqual({
      pathname: '/aaa/',
      searchParams: {},
      hash: '',
    });

    expect(createRoute(createRoute('/'), { pathname: '/' }).getLocation()).toEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
    });
  });

  test('adds hash', () => {
    expect(createRoute('aaa').getLocation(undefined, { hash: '' })).toEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
    });

    expect(createRoute('aaa').getLocation(undefined, { hash: '#$%' })).toEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '#$%',
    });

    expect(createRoute('aaa').getLocation(undefined, { hash: 'xxx' })).toEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: 'xxx',
    });
  });

  test('interpolates pathname params', () => {
    expect(createRoute<{ bbb: string }>('aaa/:bbb').getLocation({ bbb: 'xxx' })).toEqual({
      pathname: '/aaa/xxx',
      searchParams: {},
      hash: '',
    });
  });

  test('unexpected search params are loose if there is no paramsAdapter', () => {
    expect(createRoute<any>('aaa/:bbb').getLocation({ bbb: 'xxx', ccc: 'yyy' })).toEqual({
      pathname: '/aaa/xxx',
      searchParams: { ccc: 'yyy' },
      hash: '',
    });
  });

  test('adds search params by omitting pathname params', () => {
    expect(
      createRoute({ pathname: 'aaa/:bbb', paramsAdapter: params => params }).getLocation({
        bbb: 'xxx',
        ccc: 'yyy',
      })
    ).toEqual({
      pathname: '/aaa/xxx',
      searchParams: { ccc: 'yyy' },
      hash: '',
    });
  });

  test('adds search params by omitting pathname params for nested routes', () => {
    const aaaRoute = createRoute({ pathname: 'aaa/:xxx', paramsAdapter: params => params });
    const bbbRoute = createRoute(aaaRoute, { pathname: 'bbb/:yyy', paramsAdapter: params => params });

    expect(bbbRoute.getLocation({ xxx: '111', yyy: '222', ccc: 'yyy' })).toEqual({
      pathname: '/aaa/111/bbb/222',
      searchParams: { ccc: 'yyy' },
      hash: '',
    });
  });

  test('no loose params if route has an adapter with toSearchParams', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      paramsAdapter: {
        parse: params => params,
        toSearchParams: _prams => ({ vvv: 111 }),
      },
    });

    expect(route.getLocation({ xxx: 'bbb', ccc: 'yyy' })).toEqual({
      pathname: '/aaa/bbb',
      searchParams: { vvv: 111 },
      hash: '',
    });
  });

  test('does not add loose params that already exist on searchParams', () => {
    const aaaRoute = createRoute({
      pathname: 'aaa',
      paramsAdapter: {
        parse: params => params,
        toSearchParams: _prams => ({ vvv: 111 }),
      },
    });

    const bbbRoute = createRoute(aaaRoute, {
      pathname: 'bbb',
      paramsAdapter: params => params,
    });

    expect(bbbRoute.getLocation({ vvv: 222, ccc: 'yyy' })).toEqual({
      pathname: '/aaa/bbb',
      searchParams: { vvv: 111, ccc: 'yyy' },
      hash: '',
    });
  });

  test('adds search params via adapter', () => {
    const paramsAdapter: ParamsAdapter<any> = {
      parse: params => params,
      toSearchParams: jest.fn(params => ({ ccc: 'yyy' })),
    };

    expect(
      createRoute({ pathname: 'aaa/:bbb', paramsAdapter }).getLocation({
        bbb: 'xxx',
      })
    ).toEqual({
      pathname: '/aaa/xxx',
      searchParams: { ccc: 'yyy' },
      hash: '',
    });

    expect(paramsAdapter.toSearchParams).toHaveBeenCalledTimes(1);
    expect(paramsAdapter.toSearchParams).toHaveBeenNthCalledWith(1, { bbb: 'xxx' });
  });
});

describe('getOrLoadComponent', () => {
  test('returns an Outlet if there is no component', () => {
    const route = createRoute();

    expect(route.getOrLoadComponent()).toBe(Outlet);
  });

  test("throws if lazyComponent doesn't return a module", async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve<any>({ foo: Component }),
    });

    await expect(route.getOrLoadComponent()).rejects.toEqual(
      new TypeError('Module loaded by a lazyComponent must default-export a component')
    );
  });

  test('returns a component', async () => {
    const route = createRoute({
      component: Component,
    });

    expect(route.getOrLoadComponent()).toBe(Component);
  });

  test('loads a lazy component', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component }),
    });

    await expect(route.getOrLoadComponent()).resolves.toEqual(Component);
  });

  test('throws if lazy component module does not default-export a function', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: 'not_a_function' as any }),
    });

    await expect(() => route.getOrLoadComponent()).rejects.toEqual(
      new TypeError('Module loaded by a lazyComponent must default-export a component')
    );
  });

  test('rejects with an error if a lazy component cannot be loaded', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(() => route.getOrLoadComponent()).rejects.toBe(111);
  });

  test('does not load a lazy component twice', async () => {
    const lazyComponentMock = jest.fn(() => Promise.resolve({ default: Component }));

    const route = createRoute({
      lazyComponent: lazyComponentMock,
    });

    await route.getOrLoadComponent();
    await route.getOrLoadComponent();
    await route.getOrLoadComponent();

    expect(lazyComponentMock).toHaveBeenCalledTimes(1);
  });

  test('loads the component again if the previous load failed', async () => {
    const lazyComponentMock = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(111))
      .mockReturnValueOnce(Promise.resolve({ default: Component }));

    const route = createRoute({
      lazyComponent: lazyComponentMock,
    });

    await expect(() => route.getOrLoadComponent()).rejects.toEqual(
      new TypeError('Module loaded by a lazyComponent must default-export a component')
    );
    await expect(route.getOrLoadComponent()).resolves.toEqual(Component);

    expect(lazyComponentMock).toHaveBeenCalledTimes(2);
  });

  test('returns the cached lazy component after the first call', async () => {
    const lazyComponentMock = jest.fn(() => Promise.resolve({ default: Component }));

    const route = createRoute({
      lazyComponent: lazyComponentMock,
    });

    await route.getOrLoadComponent();

    expect(route.getOrLoadComponent()).toBe(Component);

    expect(lazyComponentMock).toHaveBeenCalledTimes(1);
  });

  test('does not throw synchronously', async () => {
    const route = createRoute({
      lazyComponent: () => {
        throw new Error('expected');
      },
    });

    await expect(route.getOrLoadComponent()).rejects.toEqual(new Error('expected'));
  });
});
