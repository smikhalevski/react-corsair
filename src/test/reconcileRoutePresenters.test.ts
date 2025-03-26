import { Router } from '../main';
import { reconcileRoutePresenters } from '../main/reconcileRoutePresenters';

describe('reconcileRoutePresenters', () => {
  test('returns not found route', () => {
    const router = new Router({
      routes: [],
      context: 111,
    });

    const manager = reconcileRoutePresenters(router, []);

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
  //   router.routePresenter = new RoutePresenter(router, null);
  //
  //   const routeMatch = { route: routeAaa, params: undefined };
  //   const manager = reconcileRoutePresenters(router, [routeMatch]);
  //
  //   expect(manager.fallbackPresenter).toBe(router.routePresenter);
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
  //   router.routePresenter = new RoutePresenter(router, null);
  //
  //   const routeMatch = { route: routeAaa, params: undefined };
  //   const manager = reconcileRoutePresenters(router, [routeMatch]);
  //
  //   expect(manager.fallbackPresenter).toBe(manager);
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
  //   router.routePresenter = new RoutePresenter(router, { route, params: undefined });
  //
  //   const manager = reconcileRoutePresenters(router, [{ route, params: undefined }]);
  //
  //   expect(manager.surrogatePresenter).toBe(manager);
  //   expect(manager.parentPresenter).toBe(null);
  //   expect(manager.childPresenter).toBe(null);
  //   expect(manager.state).toBe(undefined);
  //   expect(manager.context).toBe(111);
  //   expect(manager.router).toBe(router);
  //   expect(manager.routeMatch).toEqual({ route, params: undefined });
  // });
});
