import { createRoute, Location, Outlet, ParamsAdapter } from '../main';

const Component = () => null;

test('throws if both component and lazyComponent are provided', () => {
  expect(() =>
    createRoute({
      component: Component,
      lazyComponent: () => Promise.resolve({ default: Component }),
    })
  ).toThrow(new Error('Route must have either a component or a lazyComponent'));
});

describe('loadComponent', () => {
  test('returns an Outlet if there is no component', async () => {
    const route = createRoute();

    expect(route.component).toBe(Outlet);
    await expect(route.loadComponent()).resolves.toBe(Outlet);
  });

  test("throws if lazyComponent doesn't return a module", async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve<any>({ foo: Component }),
    });

    await expect(route.loadComponent()).rejects.toStrictEqual(
      new TypeError('Module loaded by a lazyComponent must default-export a component')
    );
  });

  test('returns a component', async () => {
    const route = createRoute({ component: Component });

    await expect(route.loadComponent()).resolves.toBe(Component);
  });

  test('loads a lazyComponent', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: Component }),
    });

    await expect(route.loadComponent()).resolves.toStrictEqual(Component);
  });

  test('throws if lazyComponent module does not default-export a function', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.resolve({ default: 'not_a_function' as any }),
    });

    await expect(() => route.loadComponent()).rejects.toStrictEqual(
      new TypeError('Module loaded by a lazyComponent must default-export a component')
    );
  });

  test('rejects with an error thrown by a lazyComponent', async () => {
    const route = createRoute({
      lazyComponent: () => Promise.reject(111),
    });

    await expect(() => route.loadComponent()).rejects.toBe(111);
  });

  test('does not load a lazyComponent twice', async () => {
    const lazyComponentMock = jest.fn(() => Promise.resolve({ default: Component }));

    const route = createRoute({
      lazyComponent: lazyComponentMock,
    });

    await route.loadComponent();
    await route.loadComponent();
    await route.loadComponent();

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

    await expect(() => route.loadComponent()).rejects.toStrictEqual(
      new TypeError('Module loaded by a lazyComponent must default-export a component')
    );
    await expect(route.loadComponent()).resolves.toStrictEqual(Component);

    expect(lazyComponentMock).toHaveBeenCalledTimes(2);
  });

  test('returns the same lazyComponent', async () => {
    const lazyComponentMock = jest.fn(() => Promise.resolve({ default: Component }));

    const route = createRoute({
      lazyComponent: lazyComponentMock,
    });

    const promise = route.loadComponent();

    await promise;

    expect(route.loadComponent()).toBe(promise);

    expect(lazyComponentMock).toHaveBeenCalledTimes(1);
  });

  test('does not throw synchronously', async () => {
    const route = createRoute({
      lazyComponent: () => {
        throw new Error('expected');
      },
    });

    await expect(route.loadComponent()).rejects.toStrictEqual(new Error('expected'));
  });
});

describe('getLocation', () => {
  test('returns a location', () => {
    const aaaRoute = createRoute('/aaa');
    const bbbRoute = createRoute(aaaRoute, '/bbb');
    const cccRoute = createRoute(bbbRoute, '/ccc');

    expect(aaaRoute.getLocation()).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(bbbRoute.getLocation()).toStrictEqual({
      pathname: '/aaa/bbb',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(cccRoute.getLocation()).toStrictEqual({
      pathname: '/aaa/bbb/ccc',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(createRoute('aaa').getLocation()).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(createRoute('aaa/').getLocation()).toStrictEqual({
      pathname: '/aaa/',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(createRoute(createRoute('/'), { pathname: '/' }).getLocation()).toStrictEqual({
      pathname: '/',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('respects hash', () => {
    expect(createRoute('aaa').getLocation(undefined, { hash: '' })).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(createRoute('aaa').getLocation(undefined, { hash: '#$%D1%84' })).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: '$ф',
      state: undefined,
    } satisfies Location);

    expect(createRoute('aaa').getLocation(undefined, { hash: 'xxx' })).toStrictEqual({
      pathname: '/aaa',
      searchParams: {},
      hash: 'xxx',
      state: undefined,
    } satisfies Location);
  });

  test('interpolates pathname params', () => {
    expect(createRoute<{ bbb: string }>('aaa/:bbb').getLocation({ bbb: 'xxx' })).toStrictEqual({
      pathname: '/aaa/xxx',
      searchParams: {},
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('unexpected search params are loose if there is no paramsAdapter', () => {
    expect(createRoute<any>('aaa/:bbb').getLocation({ bbb: 'xxx', ccc: 'yyy' })).toStrictEqual({
      pathname: '/aaa/xxx',
      searchParams: { ccc: 'yyy' },
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('adds search params by omitting pathname params', () => {
    expect(
      createRoute({ pathname: 'aaa/:bbb', paramsAdapter: params => params }).getLocation({ bbb: 'xxx', ccc: 'yyy' })
    ).toStrictEqual({
      pathname: '/aaa/xxx',
      searchParams: { ccc: 'yyy' },
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('adds search params by omitting pathname params for nested routes', () => {
    const aaaRoute = createRoute({ pathname: 'aaa/:xxx', paramsAdapter: params => params });
    const bbbRoute = createRoute(aaaRoute, { pathname: 'bbb/:yyy', paramsAdapter: params => params });

    expect(bbbRoute.getLocation({ xxx: '111', yyy: '222', ccc: 'yyy' })).toStrictEqual({
      pathname: '/aaa/111/bbb/222',
      searchParams: { ccc: 'yyy' },
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('no loose params if route has an adapter with toSearchParams', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      paramsAdapter: {
        parse: params => params,
        toSearchParams: _prams => ({ vvv: 111 }),
      },
    });

    expect(route.getLocation({ xxx: 'bbb', ccc: 'yyy' })).toStrictEqual({
      pathname: '/aaa/bbb',
      searchParams: { vvv: 111 },
      hash: '',
      state: undefined,
    } satisfies Location);
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

    expect(bbbRoute.getLocation({ vvv: 222, ccc: 'yyy' })).toStrictEqual({
      pathname: '/aaa/bbb',
      searchParams: { vvv: 111, ccc: 'yyy' },
      hash: '',
      state: undefined,
    } satisfies Location);
  });

  test('adds search params via adapter', () => {
    const paramsAdapter: ParamsAdapter<any> = {
      parse: params => params,
      toSearchParams: jest.fn(params => ({ ccc: 'yyy' })),
    };

    expect(createRoute({ pathname: 'aaa/:bbb', paramsAdapter }).getLocation({ bbb: 'xxx' })).toStrictEqual({
      pathname: '/aaa/xxx',
      searchParams: { ccc: 'yyy' },
      hash: '',
      state: undefined,
    } satisfies Location);

    expect(paramsAdapter.toSearchParams).toHaveBeenCalledTimes(1);
    expect(paramsAdapter.toSearchParams).toHaveBeenNthCalledWith(1, { bbb: 'xxx' });
  });
});
