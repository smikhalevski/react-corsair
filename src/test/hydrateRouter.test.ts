import { createRoute, hydrateRouter, Router } from '../main';
import { RoutePresenterState } from '../main/RoutePresenter';

beforeEach(() => {
  window.__REACT_CORSAIR_SSR_STATE__ = undefined;
});

test('returns the provided router', () => {
  const router = new Router({ routes: [], context: undefined });

  expect(hydrateRouter(router, {})).toBe(router);
});

test('hydrates a post-populated root route presenter', async () => {
  const route0 = createRoute('/aaa');

  const router = new Router({ routes: [route0], context: undefined });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootPresenter).not.toBe(null);
  expect(router.rootPresenter!.route).toBe(route0);
  expect(router.rootPresenter!.state.status).toBe('loading');
  expect(router.rootPresenter!.parentPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter).toBe(null);

  const promise0 = router.rootPresenter!.loadingPromise;

  expect(promise0).not.toBe(null);

  window.__REACT_CORSAIR_SSR_STATE__!.set(
    0,
    JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RoutePresenterState)
  );

  expect(router.rootPresenter!.state.status).toBe('ok');
  expect(router.rootPresenter!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootPresenter!.loadingPromise).toBe(null);

  await expect(promise0).rejects.toEqual(new DOMException('The operation was aborted.', 'AbortError'));
});

test('hydrates a post-populated nested route presenter', async () => {
  const route0 = createRoute('/aaa');
  const route1 = createRoute(route0, '/bbb');

  const router = new Router({ routes: [route1], context: undefined });

  hydrateRouter(router, { pathname: '/aaa/bbb' });

  expect(router.rootPresenter).not.toBe(null);
  expect(router.rootPresenter!.route).toBe(route0);
  expect(router.rootPresenter!.state.status).toBe('loading');
  expect(router.rootPresenter!.parentPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter).not.toBe(null);
  expect(router.rootPresenter!.loadingPromise).not.toBe(null);

  expect(router.rootPresenter!.childPresenter!.route).toBe(route1);
  expect(router.rootPresenter!.childPresenter!.state.status).toBe('loading');
  expect(router.rootPresenter!.childPresenter!.parentPresenter).toBe(router.rootPresenter);
  expect(router.rootPresenter!.childPresenter!.childPresenter).toBe(null);

  const promise1 = router.rootPresenter!.childPresenter!.loadingPromise;

  expect(promise1).not.toBe(null);

  window.__REACT_CORSAIR_SSR_STATE__!.set(
    1,
    JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RoutePresenterState)
  );

  expect(router.rootPresenter!.state.status).toBe('loading');

  expect(router.rootPresenter!.childPresenter!.state.status).toBe('ok');
  expect(router.rootPresenter!.childPresenter!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootPresenter!.childPresenter!.loadingPromise).toBe(null);

  await expect(promise1).rejects.toEqual(new DOMException('The operation was aborted.', 'AbortError'));
});

test('hydrates a pre-populated root route presenter with OK state', () => {
  window.__REACT_CORSAIR_SSR_STATE__ = new Map([
    [0, JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RoutePresenterState)],
  ]);

  const route0 = createRoute('/aaa');

  const router = new Router({ routes: [route0], context: undefined });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootPresenter).not.toBe(null);
  expect(router.rootPresenter!.route).toBe(route0);
  expect(router.rootPresenter!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootPresenter!.parentPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter).toBe(null);
  expect(router.rootPresenter!.loadingPromise).toBe(null);
});

test('hydrates a pre-populated root route presenter with loading state', () => {
  window.__REACT_CORSAIR_SSR_STATE__ = new Map([
    [0, JSON.stringify({ status: 'loading' } satisfies RoutePresenterState)],
  ]);

  const route0 = createRoute('/aaa');

  const router = new Router({ routes: [route0], context: undefined });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootPresenter).not.toBe(null);
  expect(router.rootPresenter!.route).toBe(route0);
  expect(router.rootPresenter!.state).toEqual({ status: 'loading' });
  expect(router.rootPresenter!.parentPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter).toBe(null);
  expect(router.rootPresenter!.loadingPromise).not.toBe(null);
});

test('hydrates a pre-populated nested route presenter', () => {
  window.__REACT_CORSAIR_SSR_STATE__ = new Map([
    [1, JSON.stringify({ status: 'ok', data: 'xxx' } satisfies RoutePresenterState)],
  ]);

  const route0 = createRoute('/aaa');
  const route1 = createRoute(route0, '/bbb');

  const router = new Router({ routes: [route1], context: undefined });

  hydrateRouter(router, { pathname: '/aaa/bbb' });

  expect(router.rootPresenter).not.toBe(null);
  expect(router.rootPresenter!.route).toBe(route0);
  expect(router.rootPresenter!.state.status).toEqual('loading');
  expect(router.rootPresenter!.parentPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter).not.toBe(null);
  expect(router.rootPresenter!.loadingPromise).not.toBe(null);

  expect(router.rootPresenter!.childPresenter!.route).toBe(route1);
  expect(router.rootPresenter!.childPresenter!.parentPresenter).toBe(router.rootPresenter);
  expect(router.rootPresenter!.childPresenter!.childPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter!.state).toEqual({ status: 'ok', data: 'xxx' });
  expect(router.rootPresenter!.childPresenter!.loadingPromise).toBe(null);
});

test('hydration is superseded by navigation', () => {
  const route0 = createRoute('/aaa');
  const route1 = createRoute('/bbb');

  const router = new Router({ routes: [route0, route1], context: undefined });

  router.subscribe(event => {
    if (event.type !== 'navigate') {
      return;
    }
    if (event.location.pathname === route0.pathnameTemplate.pattern) {
      router.navigate(route1);
    }
  });

  hydrateRouter(router, { pathname: '/aaa' });

  expect(router.rootPresenter).not.toBe(null);
  expect(router.rootPresenter!.route).toBe(route1);
  expect(router.rootPresenter!.state.status).toEqual('ok');
  expect(router.rootPresenter!.parentPresenter).toBe(null);
  expect(router.rootPresenter!.childPresenter).toBe(null);
  expect(router.rootPresenter!.loadingPromise).toBe(null);
});

test('throws if hydration is started twice for the same router', () => {
  const router = new Router({ routes: [], context: undefined });
  hydrateRouter(router, {});

  expect(() => hydrateRouter(router, {})).toThrow(new Error('Router hydration has already begun'));
});

test('throws if hydration is started twice for different routers', () => {
  hydrateRouter(new Router({ routes: [], context: undefined }), {});

  expect(() => hydrateRouter(new Router({ routes: [], context: undefined }), {})).toThrow(
    new Error('Router hydration has already begun')
  );
});
