import { createRoute, RouteController, Router, RouteState } from '../main';
import { reconcileControllers } from '../main/reconcileControllers';
import { matchRoutes } from '../main/matchRoutes';

test('returns null for empty matches', () => {
  const router = new Router({ routes: [] });

  const controller = reconcileControllers(router, []);

  expect(controller).toBeNull();
});

test('reuses OK state if nothing is changed', () => {
  const route = createRoute('/aaa');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, route, {});

  router.rootController.setData('aaa');

  const controller = reconcileControllers(router, [{ route, params: {} }])!;

  expect(controller.state).toBe(router.rootController.state);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBeNull();
});

test('reuses error state if nothing is changed', () => {
  const route = createRoute('/aaa');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, route, {});

  router.rootController.setError('aaa');

  const controller = reconcileControllers(router, [{ route, params: {} }])!;

  expect(controller.state).toBe(router.rootController.state);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBeNull();
});

test('does not reuse loading state if nothing is changed', () => {
  const route = createRoute('/aaa');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, route, {});

  const controller = reconcileControllers(router, [{ route, params: {} }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBeNull();
});

test('uses replaced controller as a fallback if params have changed', () => {
  const route = createRoute('/aaa');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, route, { zzz: 111 });

  router.rootController.setData('aaa');

  const controller = reconcileControllers(router, [{ route, params: { zzz: 222 } }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBe(router.rootController);
});

test('uses replaced controller as a fallback if context has changed', () => {
  const route = createRoute('/aaa');

  const router = new Router({ routes: [], context: 111 });

  router.rootController = new RouteController(router, route, {});

  router.rootController.setData('aaa');

  router.context = 222;

  const controller = reconcileControllers(router, [{ route, params: {} }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBe(router.rootController);
});

test('does not use replaced controller as a fallback if its state is not OK and params have changed', () => {
  const route = createRoute('/aaa');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, route, { zzz: 111 });

  router.rootController.setError('aaa');

  const controller = reconcileControllers(router, [{ route, params: { zzz: 222 } }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBeNull();
});

test('does not use replaced controller as a fallback if loadingAppearance is loading', () => {
  const route = createRoute({
    pathname: '/aaa',
    loadingAppearance: 'loading',
  });

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, route, { zzz: 111 });

  router.rootController.setData('aaa');

  const controller = reconcileControllers(router, [{ route, params: { zzz: 222 } }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(route);
  expect(controller.fallbackController).toBeNull();
});

test('uses replaced controller as a fallback if route has changed and its state is OK', () => {
  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute('/bbb');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, routeAaa, {});

  router.rootController.setData('aaa');

  const controller = reconcileControllers(router, [{ route: routeBbb, params: {} }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(routeBbb);
  expect(controller.fallbackController).toBe(router.rootController);
});

test('uses replaced controller as a fallback if route has changed and loadingAppearance is not avoid', () => {
  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute({
    pathname: '/bbb',
    loadingAppearance: 'route_loading',
  });

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, routeAaa, {});

  router.rootController.setData('aaa');

  const controller = reconcileControllers(router, [{ route: routeBbb, params: {} }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(routeBbb);
  expect(controller.fallbackController).toBeNull();
});

test('does not use replaced controller as a fallback if route has changed and its state is not OK', () => {
  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute('/bbb');

  const router = new Router({ routes: [] });

  router.rootController = new RouteController(router, routeAaa, {});

  router.rootController.setError('aaa');

  const controller = reconcileControllers(router, [{ route: routeBbb, params: {} }])!;

  expect(controller.state).not.toBe(router.rootController.state);
  expect(controller.state).toEqual({ status: 'loading' } satisfies RouteState);
  expect(controller.route).toBe(routeBbb);
  expect(controller.fallbackController).toBeNull();
});

test('uses previous controller as a fallback for a nested route', () => {
  const routeAaa = createRoute('/aaa');
  const routeBbb = createRoute(routeAaa, '/bbb');
  const routeCcc = createRoute(routeAaa, '/ccc');

  const router = new Router({ routes: [routeBbb] });

  router.navigate(routeBbb);

  const prevController = router.rootController;

  const routeMatches = matchRoutes('/aaa/ccc', {}, [routeCcc]);

  const controller = reconcileControllers(router, routeMatches)!;

  expect(controller.state.status).toBe('ok');
  expect(controller.route).toBe(routeAaa);
  expect(controller.fallbackController).toBeNull();
  expect(controller.childController!.state.status).toBe('loading');
  expect(controller.childController!.route).toBe(routeCcc);
  expect(controller.childController!.fallbackController).toBe(prevController!.childController);
});
