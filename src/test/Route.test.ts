import { FC } from 'react';
import { createRoute, Outlet, ParamsAdapter } from '../main';

describe('Route', () => {
  describe('getLocation', () => {
    test('returns a location', () => {
      const aaaRoute = createRoute({ pathname: '/aaa' });
      const bbbRoute = createRoute(aaaRoute, { pathname: '/bbb' });
      const cccRoute = createRoute(bbbRoute, { pathname: '/ccc' });

      expect(aaaRoute.getLocation()).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
      expect(bbbRoute.getLocation()).toEqual({ pathname: '/aaa/bbb', searchParams: {}, hash: '' });
      expect(cccRoute.getLocation()).toEqual({ pathname: '/aaa/bbb/ccc', searchParams: {}, hash: '' });

      expect(createRoute({ pathname: 'aaa' }).getLocation()).toEqual({ pathname: '/aaa', searchParams: {}, hash: '' });
      expect(createRoute({ pathname: 'aaa/' }).getLocation()).toEqual({
        pathname: '/aaa/',
        searchParams: {},
        hash: '',
      });

      expect(createRoute(createRoute({ pathname: '/' }), { pathname: '/' }).getLocation()).toEqual({
        pathname: '/',
        searchParams: {},
        hash: '',
      });
    });

    test('adds hash', () => {
      expect(createRoute({ pathname: 'aaa' }).getLocation(undefined, { hash: '' })).toEqual({
        pathname: '/aaa',
        searchParams: {},
        hash: '',
      });

      expect(createRoute({ pathname: 'aaa' }).getLocation(undefined, { hash: '#' })).toEqual({
        pathname: '/aaa',
        searchParams: {},
        hash: '',
      });

      expect(createRoute({ pathname: 'aaa' }).getLocation(undefined, { hash: 'xxx' })).toEqual({
        pathname: '/aaa',
        searchParams: {},
        hash: '#xxx',
      });

      expect(createRoute({ pathname: 'aaa' }).getLocation(undefined, { hash: '$%#' })).toEqual({
        pathname: '/aaa',
        searchParams: {},
        hash: '#%24%25%23',
      });
    });

    test('interpolates pathname params', () => {
      expect(createRoute<{ bbb: string }>({ pathname: 'aaa/:bbb' }).getLocation({ bbb: 'xxx' })).toEqual({
        pathname: '/aaa/xxx',
        searchParams: {},
        hash: '',
      });
    });

    test('ignores unexpected search params', () => {
      expect(createRoute<any>({ pathname: 'aaa/:bbb' }).getLocation({ bbb: 'xxx', ccc: 'yyy' })).toEqual({
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

  describe('getComponent', () => {
    const Component: FC = () => null;

    test('returns an Outlet if there is no component', () => {
      const route = createRoute({});

      expect(route.getComponent()).toEqual(Outlet);
    });

    test('throws if both component and lazyComponent are provided', () => {
      expect(() =>
        createRoute({
          component: Component,
          lazyComponent: () => Promise.resolve({ default: Component }),
        })
      ).toThrow(new Error('Route must have either a component or a lazyComponent'));
    });

    test('returns a component', () => {
      const route = createRoute({
        component: Component,
      });

      expect(route.getComponent()).toEqual(Component);
    });

    test('loads a lazy component', async () => {
      const route = createRoute({
        lazyComponent: () => Promise.resolve({ default: Component }),
      });

      await expect(route.getComponent()).resolves.toEqual(Component);
    });

    test('throws if lazy component module does not default-export a function', async () => {
      const route = createRoute({
        lazyComponent: () => Promise.resolve({ default: 'not_a_function' as any }),
      });

      await expect(() => route.getComponent()).rejects.toEqual(new TypeError('Module must default-export a component'));
    });

    test('rejects with an error if a lazy component cannot be loaded', async () => {
      const route = createRoute({
        lazyComponent: () => Promise.reject(111),
      });

      await expect(() => route.getComponent()).rejects.toBe(111);
    });

    test('does not load a lazy component twice', async () => {
      const lazyComponentMock = jest.fn(() => Promise.resolve({ default: Component }));

      const route = createRoute({
        lazyComponent: lazyComponentMock,
      });

      await route.getComponent();
      await route.getComponent();
      await route.getComponent();

      expect(lazyComponentMock).toHaveBeenCalledTimes(1);
    });

    test('loads the component again if the previous load failed', async () => {
      const lazyComponentMock = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve(111))
        .mockReturnValueOnce(Promise.resolve(222))
        .mockReturnValueOnce(Promise.resolve({ default: Component }));

      const route = createRoute({
        lazyComponent: lazyComponentMock,
      });

      await expect(() => route.getComponent()).rejects.toEqual(expect.any(TypeError));
      await expect(() => route.getComponent()).rejects.toEqual(expect.any(TypeError));
      await expect(route.getComponent()).resolves.toEqual(Component);

      expect(lazyComponentMock).toHaveBeenCalledTimes(3);
    });

    test('returns lazy component synchronously after the first call', async () => {
      const lazyComponentMock = jest.fn(() => Promise.resolve({ default: Component }));

      const route = createRoute({
        lazyComponent: lazyComponentMock,
      });

      await route.getComponent();

      expect(route.getComponent()).toEqual(Component);
    });
  });

  describe('prefetch', () => {
    test('calls contentProvider for all ancestors', () => {
      const aaaLoaderMock = jest.fn(() => undefined);
      const bbbLoaderMock = jest.fn(() => undefined);
      const cccLoaderMock = jest.fn(() => undefined);

      const aaaRoute = createRoute({ loader: aaaLoaderMock });
      const bbbRoute = createRoute(aaaRoute, { loader: bbbLoaderMock });
      const cccRoute = createRoute(bbbRoute, { loader: cccLoaderMock });

      cccRoute.prefetch();

      expect(aaaLoaderMock).toHaveBeenCalledTimes(1);
      expect(bbbLoaderMock).toHaveBeenCalledTimes(1);
      expect(cccLoaderMock).toHaveBeenCalledTimes(1);
    });
  });
});
