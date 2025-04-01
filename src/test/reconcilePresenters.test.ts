import { Router } from '../main';
import { reconcileControllers } from '../main/reconcileControllers';

test('returns not found route', () => {
  const router = new Router({
    routes: [],
    context: 111,
  });

  const controller = reconcileControllers(router, []);

  expect(controller).toBe(null);
});

// test('show previous active controller during loading if loadingAppearance is auto', () => {
//   const router = new Router({
//     routes: [],
//     context: 111,
//   });
//
//   const routeAaa = createRoute('/aaa');
//
//   expect(routeAaa.loadingAppearance).toBe('avoid');
//
//   router.controller = new Controller(router, null);
//
//   const routeMatch = { route: routeAaa, params: undefined };
//   const controller = reconcileControllers(router, [routeMatch]);
//
//   expect(controller.fallbackController).toBe(router.controller);
//   expect(controller.state).toBe(undefined);
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
//   router.controller = new Controller(router, null);
//
//   const routeMatch = { route: routeAaa, params: undefined };
//   const controller = reconcileControllers(router, [routeMatch]);
//
//   expect(controller.fallbackController).toBe(controller);
//   expect(controller.state).toBe(undefined);
// });

// test('returns not found route', () => {
//   const router = new Router({
//     routes: [],
//     context: 111,
//   });
//
//   const route = createRoute('/aaa');
//
//   router.controller = new Controller(router, { route, params: undefined });
//
//   const controller = reconcileControllers(router, [{ route, params: undefined }]);
//
//   expect(controller.surrogateController).toBe(controller);
//   expect(controller.parentController).toBe(null);
//   expect(controller.childController).toBe(null);
//   expect(controller.state).toBe(undefined);
//   expect(controller.context).toBe(111);
//   expect(controller.router).toBe(router);
//   expect(controller.routeMatch).toEqual({ route, params: undefined });
// });
