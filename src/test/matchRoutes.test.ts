import { createRoute } from '../main/createRoute';
import { matchRoutes } from '../main/matchRoutes';

describe('matchRoutes', () => {
  const aaaRoute = createRoute({ pathname: '/aaa' });
  const bbbRoute = createRoute(aaaRoute, { pathname: '/bbb' });
  const cccRoute = createRoute(bbbRoute, { pathname: '/ccc' });

  test('matches routes', () => {
    expect(matchRoutes('/aaa', {}, [aaaRoute])).toEqual([{ route: aaaRoute, params: {} }]);

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute])).toBeNull();

    expect(matchRoutes('/aaa', {}, [aaaRoute, bbbRoute])).toEqual([{ route: aaaRoute, params: {} }]);

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute, bbbRoute])).toEqual([
      { route: aaaRoute, params: {} },
      { route: bbbRoute, params: {} },
    ]);

    expect(matchRoutes('/bbb', {}, [bbbRoute, aaaRoute])).toBeNull();
  });

  test('does not match intermediate routes', () => {
    expect(matchRoutes('/aaa', {}, [aaaRoute, cccRoute])).toEqual([{ route: aaaRoute, params: {} }]);

    expect(matchRoutes('/aaa/bbb', {}, [aaaRoute, cccRoute])).toBeNull();

    expect(matchRoutes('/aaa/bbb/ccc', {}, [aaaRoute, cccRoute])).toEqual([
      { route: aaaRoute, params: {} },
      { route: bbbRoute, params: {} },
      { route: cccRoute, params: {} },
    ]);
  });
});
