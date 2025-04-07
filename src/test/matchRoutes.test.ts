import { createRoute } from '../main';
import { matchRoutes } from '../main/matchRoutes';

const aaaRoute = createRoute('/aaa');
const bbbRoute = createRoute(aaaRoute, '/bbb');
const cccRoute = createRoute(bbbRoute, '/ccc');

test('matches routes', () => {
  expect(matchRoutes('/aaa', {}, [aaaRoute])).toStrictEqual([{ route: aaaRoute, params: {} }]);

  expect(matchRoutes('/aaa/bbb', {}, [aaaRoute])).toStrictEqual([]);

  expect(matchRoutes('/aaa', {}, [aaaRoute, bbbRoute])).toStrictEqual([{ route: aaaRoute, params: {} }]);

  expect(matchRoutes('/aaa/bbb', {}, [aaaRoute, bbbRoute])).toStrictEqual([
    { route: aaaRoute, params: {} },
    { route: bbbRoute, params: {} },
  ]);

  expect(matchRoutes('/bbb', {}, [bbbRoute, aaaRoute])).toStrictEqual([]);
});

test('does not match intermediate routes', () => {
  expect(matchRoutes('/aaa', {}, [aaaRoute, cccRoute])).toStrictEqual([{ route: aaaRoute, params: {} }]);

  expect(matchRoutes('/aaa/bbb', {}, [aaaRoute, cccRoute])).toStrictEqual([]);

  expect(matchRoutes('/aaa/bbb/ccc', {}, [aaaRoute, cccRoute])).toStrictEqual([
    { route: aaaRoute, params: {} },
    { route: bbbRoute, params: {} },
    { route: cccRoute, params: {} },
  ]);
});

test('extracts pathname params', () => {
  const aaaRoute = createRoute('/aaa/:xxx');

  expect(matchRoutes('/aaa/bbb', {}, [aaaRoute])).toStrictEqual([{ route: aaaRoute, params: { xxx: 'bbb' } }]);
});

test('extracts pathname params from nested routes', () => {
  const aaaRoute = createRoute('/aaa/:xxx');
  const bbbRoute = createRoute(aaaRoute, '/bbb/:yyy');

  expect(matchRoutes('/aaa/ppp/bbb/qqq', {}, [bbbRoute])).toStrictEqual([
    { route: aaaRoute, params: { xxx: 'ppp' } },
    { route: bbbRoute, params: { xxx: 'ppp', yyy: 'qqq' } },
  ]);
});

test('merges pathname params and search params', () => {
  const aaaRoute = createRoute('/aaa/:xxx');
  const bbbRoute = createRoute(aaaRoute, '/bbb/:yyy');

  expect(matchRoutes('/aaa/ppp/bbb/qqq', { ttt: '111', lll: '222' }, [bbbRoute])).toStrictEqual([
    { route: aaaRoute, params: { lll: '222', ttt: '111', xxx: 'ppp' } },
    { route: bbbRoute, params: { lll: '222', ttt: '111', xxx: 'ppp', yyy: 'qqq' } },
  ]);
});

test('pathname params have precedence over search params', () => {
  const aaaRoute = createRoute({ pathname: '/aaa/:xxx' });

  expect(matchRoutes('/aaa/111', { xxx: 222 }, [aaaRoute])).toStrictEqual([
    { route: aaaRoute, params: { xxx: '111' } },
  ]);
});

test('uses params adapter to parse params', () => {
  const aaaParamsAdapterMock = jest.fn(params => ({ vvv: 111 }));
  const bbbParamsAdapterMock = jest.fn(params => ({ zzz: 222 }));

  const aaaRoute = createRoute({ pathname: '/aaa/:xxx', paramsAdapter: aaaParamsAdapterMock });
  const bbbRoute = createRoute(aaaRoute, { pathname: '/bbb/:yyy', paramsAdapter: bbbParamsAdapterMock });

  expect(matchRoutes('/aaa/ppp/bbb/qqq', { ttt: '111', lll: '222' }, [bbbRoute])).toStrictEqual([
    { route: aaaRoute, params: { vvv: 111 } },
    { route: bbbRoute, params: { zzz: 222 } },
  ]);

  expect(aaaParamsAdapterMock).toHaveBeenCalledTimes(1);
  expect(aaaParamsAdapterMock).toHaveBeenNthCalledWith(1, { lll: '222', ttt: '111', xxx: 'ppp' });

  expect(bbbParamsAdapterMock).toHaveBeenCalledTimes(1);
  expect(bbbParamsAdapterMock).toHaveBeenNthCalledWith(1, { lll: '222', ttt: '111', xxx: 'ppp', yyy: 'qqq' });
});
