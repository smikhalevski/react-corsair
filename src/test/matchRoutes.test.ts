import { createRoute } from '../main';
import { matchRoutes } from '../main/matchRoutes';

describe('matchRoutes', () => {
  const aaaRoute = createRoute('/aaa');
  const bbbRoute = createRoute(aaaRoute, '/bbb');
  const cccRoute = createRoute(bbbRoute, '/ccc');

  test('matches routes', () => {
    expect(matchRoutes('/aaa', {}, [aaaRoute])).toEqual([{ route: aaaRoute, params: undefined }]);

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute])).toEqual([]);

    expect(matchRoutes('/aaa', {}, [aaaRoute, bbbRoute])).toEqual([{ route: aaaRoute, params: undefined }]);

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute, bbbRoute])).toEqual([
      { route: aaaRoute, params: undefined },
      { route: bbbRoute, params: undefined },
    ]);

    expect(matchRoutes('/bbb', {}, [bbbRoute, aaaRoute])).toEqual([]);
  });

  test('does not match intermediate routes', () => {
    expect(matchRoutes('/aaa', {}, [aaaRoute, cccRoute])).toEqual([{ route: aaaRoute, params: undefined }]);

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute, cccRoute])).toEqual([]);

    expect(matchRoutes('/aaa/bbb/ccc', {}, [aaaRoute, cccRoute])).toEqual([
      { route: aaaRoute, params: undefined },
      { route: bbbRoute, params: undefined },
      { route: cccRoute, params: undefined },
    ]);
  });

  test('extracts pathname params', () => {
    const aaaRoute = createRoute('/aaa/:xxx');

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute])).toEqual([{ route: aaaRoute, params: { xxx: 'bbb' } }]);
  });

  test('extracts pathname params from nested routes', () => {
    const aaaRoute = createRoute('/aaa/:xxx');
    const bbbRoute = createRoute(aaaRoute, '/bbb/:yyy');

    expect(matchRoutes('/aaa/ppp/bbb/qqq', {}, [bbbRoute])).toEqual([
      { route: aaaRoute, params: { xxx: 'ppp' } },
      { route: bbbRoute, params: { yyy: 'qqq' } },
    ]);
  });

  test('ignores search params without paramsAdapted', () => {
    const aaaRoute = createRoute('/aaa/:xxx');
    const bbbRoute = createRoute(aaaRoute, '/bbb/:yyy');

    expect(matchRoutes('/aaa/ppp/bbb/qqq', { ttt: '111', lll: '222' }, [bbbRoute])).toEqual([
      { route: aaaRoute, params: { xxx: 'ppp' } },
      { route: bbbRoute, params: { yyy: 'qqq' } },
    ]);
  });

  test('uses params adapter to parse params', () => {
    const aaaParamsAdapterMock = jest.fn(params => ({ vvv: 111 }));
    const bbbParamsAdapterMock = jest.fn(params => ({ zzz: 222 }));

    const aaaRoute = createRoute({ pathname: '/aaa/:xxx', paramsAdapter: aaaParamsAdapterMock });
    const bbbRoute = createRoute(aaaRoute, { pathname: '/bbb/:yyy', paramsAdapter: bbbParamsAdapterMock });

    expect(matchRoutes('/aaa/ppp/bbb/qqq', { ttt: '111', lll: '222' }, [bbbRoute])).toEqual([
      { route: aaaRoute, params: { vvv: 111 } },
      { route: bbbRoute, params: { zzz: 222 } },
    ]);

    expect(aaaParamsAdapterMock).toHaveBeenCalledTimes(1);
    expect(aaaParamsAdapterMock).toHaveBeenNthCalledWith(1, { lll: '222', ttt: '111', xxx: 'ppp' });

    expect(bbbParamsAdapterMock).toHaveBeenCalledTimes(1);
    expect(bbbParamsAdapterMock).toHaveBeenNthCalledWith(1, { lll: '222', ttt: '111', yyy: 'qqq' });
  });

  test('pathname params have precedence over search params', () => {
    const aaaRoute = createRoute({ pathname: '/aaa/:xxx', paramsAdapter: params => params });

    expect(matchRoutes('/aaa/111', { xxx: 222 }, [aaaRoute])).toEqual([{ route: aaaRoute, params: { xxx: '111' } }]);
  });
});
