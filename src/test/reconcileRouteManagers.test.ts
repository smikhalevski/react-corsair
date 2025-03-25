import { Router } from '../main';
import { reconcileRouteManagers } from '../main/reconcileRouteManagers';

describe('reconcileRouteManagers', () => {
  test('returns not found route', () => {
    const router = new Router({
      routes: [],
      context: 111,
    });

    const manager = reconcileRouteManagers(router, []);

    expect(manager).toBe(null);
  });

  // test('show previous active manager during loading if loadingAppearance is auto', () => {
  //   const router = new Router({
  //     routes: [],
  //     context: 111,
  //   });
  //
  //   const routeAaa = createRoute('/aaa');
  //
  //   expect(routeAaa.loadingAppearance).toBe('avoid');
  //
  //   router.routeManager = new RouteManager(router, null);
  //
  //   const routeMatch = { route: routeAaa, params: undefined };
  //   const manager = reconcileRouteManagers(router, [routeMatch]);
  //
  //   expect(manager.fallbackManager).toBe(router.routeManager);
  //   expect(manager.state).toBe(undefined);
  // });
  //
  // test('show self during loading if loadingAppearance is loading', () => {
  //   const router = new Router({
  //     routes: [],
  //     context: 111,
  //   });
  //
  //   const routeAaa = createRoute({ pathname: '/aaa', loadingAppearance: 'loading' });
  //
  //   router.routeManager = new RouteManager(router, null);
  //
  //   const routeMatch = { route: routeAaa, params: undefined };
  //   const manager = reconcileRouteManagers(router, [routeMatch]);
  //
  //   expect(manager.fallbackManager).toBe(manager);
  //   expect(manager.state).toBe(undefined);
  // });

  // test('returns not found route', () => {
  //   const router = new Router({
  //     routes: [],
  //     context: 111,
  //   });
  //
  //   const route = createRoute('/aaa');
  //
  //   router.routeManager = new RouteManager(router, { route, params: undefined });
  //
  //   const manager = reconcileRouteManagers(router, [{ route, params: undefined }]);
  //
  //   expect(manager.surrogateManager).toBe(manager);
  //   expect(manager.parentManager).toBe(null);
  //   expect(manager.childManager).toBe(null);
  //   expect(manager.state).toBe(undefined);
  //   expect(manager.context).toBe(111);
  //   expect(manager.router).toBe(router);
  //   expect(manager.routeMatch).toEqual({ route, params: undefined });
  // });
});
