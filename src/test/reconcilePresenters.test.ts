import { Router } from '../main';
import { reconcilePresenters } from '../main/reconcilePresenters';

test('returns not found route', () => {
  const router = new Router({
    routes: [],
    context: 111,
  });

  const presenter = reconcilePresenters(router, []);

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
//   router.presenter = new Presenter(router, null);
//
//   const routeMatch = { route: routeAaa, params: undefined };
//   const presenter = reconcilePresenters(router, [routeMatch]);
//
//   expect(presenter.fallbackPresenter).toBe(router.presenter);
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
//   router.presenter = new Presenter(router, null);
//
//   const routeMatch = { route: routeAaa, params: undefined };
//   const presenter = reconcilePresenters(router, [routeMatch]);
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
//   router.presenter = new Presenter(router, { route, params: undefined });
//
//   const presenter = reconcilePresenters(router, [{ route, params: undefined }]);
//
//   expect(presenter.surrogatePresenter).toBe(presenter);
//   expect(presenter.parentPresenter).toBe(null);
//   expect(presenter.childPresenter).toBe(null);
//   expect(presenter.state).toBe(undefined);
//   expect(presenter.context).toBe(111);
//   expect(presenter.router).toBe(router);
//   expect(presenter.routeMatch).toEqual({ route, params: undefined });
// });
