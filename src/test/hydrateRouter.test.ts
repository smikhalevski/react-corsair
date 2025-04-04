import { createRoute, hydrateRouter, Router } from '../main';
import { RouteState } from '../main/RouteController';

beforeEach(() => {
  window.__REACT_CORSAIR_SSR_STATE__ = undefined;
});

test('returns the provided router', () => {
  const router = new Router({ routes: [] });

  expect(hydrateRouter(router, {})).toBe(router);
});

test('hydrates a post-populated root controller', async () => {
  const route0 = createRoute('/aaa');

  const router = new Router({ routes: [route0] });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootController).not.toBeNull();
  expect(router.rootController!.route).toBe(route0);
  expect(router.rootController!.state.status).toBe('loading');
  expect(router.rootController!.parentController).toBeNull();
  expect(router.rootController!.childController).toBeNull();

  const promise0 = router.rootController!.loadingPromise;

  expect(promise0).not.toBeNull();

  window.__REACT_CORSAIR_SSR_STATE__!.set(0, JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RouteState));

  expect(router.rootController!.state.status).toBe('ok');
  expect(router.rootController!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootController!.loadingPromise).toBeNull();

  await expect(promise0).rejects.toEqual(new DOMException('Route state was superseded', 'AbortError'));
});

test('hydrates a post-populated nested controller', async () => {
  const route0 = createRoute('/aaa');
  const route1 = createRoute(route0, '/bbb');

  const router = new Router({ routes: [route1] });

  hydrateRouter(router, { pathname: '/aaa/bbb' });

  expect(router.rootController).not.toBeNull();
  expect(router.rootController!.route).toBe(route0);
  expect(router.rootController!.state.status).toBe('loading');
  expect(router.rootController!.parentController).toBeNull();
  expect(router.rootController!.childController).not.toBeNull();
  expect(router.rootController!.loadingPromise).not.toBeNull();

  expect(router.rootController!.childController!.route).toBe(route1);
  expect(router.rootController!.childController!.state.status).toBe('loading');
  expect(router.rootController!.childController!.parentController).toBe(router.rootController);
  expect(router.rootController!.childController!.childController).toBeNull();

  const promise1 = router.rootController!.childController!.loadingPromise;

  expect(promise1).not.toBeNull();

  window.__REACT_CORSAIR_SSR_STATE__!.set(1, JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RouteState));

  expect(router.rootController!.state.status).toBe('loading');

  expect(router.rootController!.childController!.state.status).toBe('ok');
  expect(router.rootController!.childController!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootController!.childController!.loadingPromise).toBeNull();

  await expect(promise1).rejects.toEqual(new DOMException('Route state was superseded', 'AbortError'));
});

test('hydrates a pre-populated root controller with OK state', () => {
  window.__REACT_CORSAIR_SSR_STATE__ = new Map([
    [0, JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RouteState)],
  ]);

  const route0 = createRoute('/aaa');

  const router = new Router({ routes: [route0] });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootController).not.toBeNull();
  expect(router.rootController!.route).toBe(route0);
  expect(router.rootController!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootController!.parentController).toBeNull();
  expect(router.rootController!.childController).toBeNull();
  expect(router.rootController!.loadingPromise).toBeNull();
});

test('hydrates a pre-populated root controller with loading state', () => {
  window.__REACT_CORSAIR_SSR_STATE__ = new Map([[0, JSON.stringify({ status: 'loading' } satisfies RouteState)]]);

  const route0 = createRoute('/aaa');

  const router = new Router({ routes: [route0] });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootController).not.toBeNull();
  expect(router.rootController!.route).toBe(route0);
  expect(router.rootController!.state).toEqual({ status: 'loading' });
  expect(router.rootController!.parentController).toBeNull();
  expect(router.rootController!.childController).toBeNull();
  expect(router.rootController!.loadingPromise).not.toBeNull();
});

test('hydrates a pre-populated nested controller', () => {
  window.__REACT_CORSAIR_SSR_STATE__ = new Map([
    [1, JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RouteState)],
  ]);

  const route0 = createRoute('/aaa');
  const route1 = createRoute(route0, '/bbb');

  const router = new Router({ routes: [route1] });

  hydrateRouter(router, { pathname: '/aaa/bbb' });

  expect(router.rootController).not.toBeNull();
  expect(router.rootController!.route).toBe(route0);
  expect(router.rootController!.state.status).toEqual('loading');
  expect(router.rootController!.parentController).toBeNull();
  expect(router.rootController!.childController).not.toBeNull();
  expect(router.rootController!.loadingPromise).not.toBeNull();

  expect(router.rootController!.childController!.route).toBe(route1);
  expect(router.rootController!.childController!.parentController).toBe(router.rootController);
  expect(router.rootController!.childController!.childController).toBeNull();
  expect(router.rootController!.childController!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootController!.childController!.loadingPromise).toBeNull();
});

test('hydration is superseded by navigation', () => {
  const route0 = createRoute('/aaa');
  const route1 = createRoute('/bbb');

  const router = new Router({ routes: [route0, route1] });

  router.subscribe(event => {
    if (event.type !== 'navigate') {
      return;
    }
    if (event.location.pathname === route0.pathnameTemplate.pattern) {
      router.navigate(route1);
    }
  });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootController).not.toBeNull();
  expect(router.rootController!.route).toBe(route1);
  expect(router.rootController!.state.status).toEqual('ok');
  expect(router.rootController!.parentController).toBeNull();
  expect(router.rootController!.childController).toBeNull();
  expect(router.rootController!.loadingPromise).toBeNull();
});

test('throws if hydration is started twice for the same router', () => {
  const router = new Router({ routes: [] });
  hydrateRouter(router, {});

  expect(() => hydrateRouter(router, {})).toThrow(new Error('Router hydration has already begun'));
});

test('throws if hydration is started twice for different routers', () => {
  hydrateRouter(new Router({ routes: [] }), {});

  expect(() => hydrateRouter(new Router({ routes: [] }), {})).toThrow(new Error('Router hydration has already begun'));
});
