import { createRoute } from '../main/createRoute';
import { ParamsAdapter } from '../main/types';

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
});
