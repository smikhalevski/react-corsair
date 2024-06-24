import { createRoute } from '../main/createRoute';
import { matchRoute } from '../main/matchRoute';

function Component1() {
  return null;
}

function Component2() {
  return null;
}

describe('matchRoute', () => {
  test('matches a route', () => {
    const route1 = createRoute('aaa', () => Component1);
    const route2 = createRoute('bbb', () => Component2);

    expect(matchRoute('aaa', [route1, route2])).toEqual({ route: route1, pathname: 'aaa' });
    expect(matchRoute('bbb', [route1, route2])).toEqual({ route: route2, pathname: 'bbb' });
    expect(matchRoute('/aaa', [route1, route2])).toEqual({ route: route1, pathname: 'aaa' });
    expect(matchRoute('/bbb', [route1, route2])).toEqual({ route: route2, pathname: 'bbb' });
  });

  test('matches a route with pathname params', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      componentLoader: () => Component1,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa/yyy', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      params: { xxx: 'yyy' },
    });
  });

  test('matches a route with pathname params but does not return them by default', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      componentLoader: () => Component1,
    });

    expect(matchRoute('aaa/yyy', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
    });
  });

  test('matches a route with search params', () => {
    const route = createRoute({
      pathname: 'aaa',
      componentLoader: () => Component1,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa?xxx=yyy', [route])).toEqual({
      route,
      pathname: 'aaa',
      params: { xxx: 'yyy' },
    });
  });

  test('matches a route with search params but does not return them by default', () => {
    const route = createRoute({
      pathname: 'aaa',
      componentLoader: () => Component1,
    });

    expect(matchRoute('aaa?xxx=yyy', [route])).toEqual({
      route,
      pathname: 'aaa',
    });
  });

  test('returns both pathname and search params', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      componentLoader: () => Component1,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa/yyy?ppp=qqq', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      params: { ppp: 'qqq', xxx: 'yyy' },
    });
  });

  test('pathname params have precedence over search params', () => {
    const route = createRoute({
      pathname: 'aaa/:xxx',
      componentLoader: () => Component1,
      paramsParser: rawParams => rawParams,
    });

    expect(matchRoute('aaa/yyy?xxx=zzz', [route])).toEqual({
      route,
      pathname: 'aaa/yyy',
      params: { xxx: 'yyy' },
    });
  });
});
