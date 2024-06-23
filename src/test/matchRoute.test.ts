import { createRoute } from '../main/createRoute';
import { matchRoute } from '../main/matchRoute';

describe('matchRoute', () => {
  test('matches a route', () => {
    const route1 = createRoute('aaa', () => 111);
    const route2 = createRoute('bbb', () => 222);

    expect(matchRoute('aaa', [route1, route2])).toEqual({
      route: route1,
      pathname: 'aaa',
      result: 111,
    });
    expect(matchRoute('bbb', [route1, route2])).toEqual({
      route: route2,
      pathname: 'bbb',
      result: 222,
    });
    expect(matchRoute('/aaa', [route1, route2])).toEqual({
      route: route1,
      pathname: 'aaa',
      result: 111,
    });
    expect(matchRoute('/bbb', [route1, route2])).toEqual({
      route: route2,
      pathname: 'bbb',
      result: 222,
    });
  });

  test('matches an async route', async () => {
    const route1 = createRoute('aaa', async () => 111);
    const route2 = createRoute('bbb', async () => 222);

    await expect(matchRoute('aaa', [route1, route2])).resolves.toEqual({
      route: route1,
      pathname: 'aaa',
      result: 111,
    });
    await expect(matchRoute('bbb', [route1, route2])).resolves.toEqual({
      route: route2,
      pathname: 'bbb',
      result: 222,
    });
    await expect(matchRoute('/aaa', [route1, route2])).resolves.toEqual({
      route: route1,
      pathname: 'aaa',
      result: 111,
    });
    await expect(matchRoute('/bbb', [route1, route2])).resolves.toEqual({
      route: route2,
      pathname: 'bbb',
      result: 222,
    });
  });

  test('matches a route that resolves with a non-undefined value', () => {
    const route1 = createRoute<number | undefined>('aaa', () => undefined);
    const route2 = createRoute<number | undefined>('aaa', () => 111);
    const route3 = createRoute<number | undefined>('bbb', () => 222);

    expect(matchRoute('aaa', [route1, route2, route3])).toEqual({
      route: route2,
      pathname: 'aaa',
      result: 111,
    });
  });

  test('matches a route with pathname params', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      resolver: () => 111,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa/yyy', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      params: { xxx: 'yyy' },
      result: 111,
    });
  });

  test('matches a route with pathname params but does not return them by default', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      resolver: () => 111,
    });

    expect(matchRoute('aaa/yyy', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      result: 111,
    });
  });

  test('matches a route with search params', () => {
    const route = createRoute({
      pathname: 'aaa',
      resolver: () => 111,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa?xxx=yyy', [route])).toEqual({
      route,
      pathname: 'aaa',
      params: { xxx: 'yyy' },
      result: 111,
    });
  });

  test('matches a route with search params but does not return them by default', () => {
    const route = createRoute({
      pathname: 'aaa',
      resolver: () => 111,
    });

    expect(matchRoute('aaa?xxx=yyy', [route])).toEqual({ route, pathname: 'aaa', result: 111 });
  });

  test('returns both pathname and search params', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      resolver: () => 111,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa/yyy?ppp=qqq', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      params: { ppp: 'qqq', xxx: 'yyy' },
      result: 111,
    });
  });

  test('pathname params have precedence over search params', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      resolver: () => 111,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa/yyy?xxx=zzz', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      params: { xxx: 'yyy' },
      result: 111,
    });
  });
});
