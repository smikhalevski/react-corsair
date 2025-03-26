import { Router } from '../main';
import { reconcileRoutePresenters } from '../main/reconcileRoutePresenters';

describe('reconcileRoutePresenters', () => {
  test('returns not found route', () => {
    const router = new Router({
      routes: [],
      context: 111,
    });

    const presenter = reconcileRoutePresenters(router, []);

    expect(presenter).toBe(null);
  });

  // test('show previous active presenter during loading if loadingAppearance is auto', () => {
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
  //   const presenter = reconcileRoutePresenters(router, [routeMatch]);
  //
  //   expect(presenter.fallbackPresenter).toBe(router.routePresenter);
  //   expect(presenter.state).toBe(undefined);
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
  //   const presenter = reconcileRoutePresenters(router, [routeMatch]);
  //
  //   expect(presenter.fallbackPresenter).toBe(presenter);
  //   expect(presenter.state).toBe(undefined);
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
  //   const presenter = reconcileRoutePresenters(router, [{ route, params: undefined }]);
  //
  //   expect(presenter.surrogatePresenter).toBe(presenter);
  //   expect(presenter.parentPresenter).toBe(null);
  //   expect(presenter.childPresenter).toBe(null);
  //   expect(presenter.state).toBe(undefined);
  //   expect(presenter.context).toBe(111);
  //   expect(presenter.router).toBe(router);
  //   expect(presenter.routeMatch).toEqual({ route, params: undefined });
  // });
});
