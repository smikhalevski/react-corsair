import { createRoute, Router } from '../main';
import { OutletManager, reconcileOutlets } from '../main/reconcileOutlets';

describe('reconcileOutlets', () => {
  test('returns not found route', () => {
    const router = new Router({
      routes: [],
      context: 111,
    });

    const manager = reconcileOutlets(router, []);

    expect(manager.activeManager).toBe(manager);
    expect(manager.parentManager).toBe(null);
    expect(manager.childManager).toBe(null);
    expect(manager.state).toBe(undefined);
    expect(manager.context).toBe(111);
    expect(manager.router).toBe(router);
    expect(manager.routeMatch).toBe(null);
  });

  test('show previous active manager during loading if loadingAppearance is auto', () => {
    const router = new Router({
      routes: [],
      context: 111,
    });

    const routeAaa = createRoute('/aaa');

    expect(routeAaa.loadingAppearance).toBe('auto');

    router.outletManager = new OutletManager(router, null);

    const routeMatch = { route: routeAaa, params: undefined };
    const manager = reconcileOutlets(router, [routeMatch]);

    expect(manager.activeManager).toBe(router.outletManager);
    expect(manager.state).toBe(undefined);
  });

  test('show self during loading if loadingAppearance is loading', () => {
    const router = new Router({
      routes: [],
      context: 111,
    });

    const routeAaa = createRoute({ pathname: '/aaa', loadingAppearance: 'loading' });

    router.outletManager = new OutletManager(router, null);

    const routeMatch = { route: routeAaa, params: undefined };
    const manager = reconcileOutlets(router, [routeMatch]);

    expect(manager.activeManager).toBe(manager);
    expect(manager.state).toBe(undefined);
  });

  // test('returns not found route', () => {
  //   const router = new Router({
  //     routes: [],
  //     context: 111,
  //   });
  //
  //   const route = createRoute('/aaa');
  //
  //   router.outletManager = new OutletManager(router, { route, params: undefined });
  //
  //   const manager = reconcileOutlets(router, [{ route, params: undefined }]);
  //
  //   expect(manager.activeManager).toBe(manager);
  //   expect(manager.parentManager).toBe(null);
  //   expect(manager.childManager).toBe(null);
  //   expect(manager.state).toBe(undefined);
  //   expect(manager.context).toBe(111);
  //   expect(manager.router).toBe(router);
  //   expect(manager.routeMatch).toEqual({ route, params: undefined });
  // });
});
