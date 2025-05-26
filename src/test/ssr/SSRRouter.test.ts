import { describe, expect, test, vi } from 'vitest';
import { SSRRouter } from '../../main/ssr/index.js';
import { createRoute, RouteState } from '../../main/index.js';

describe('navigate', () => {
  test('loads routes', async () => {
    const dataLoaderMock = vi.fn();

    const route = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
    });

    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(dataLoaderMock).toHaveBeenCalledTimes(1);
  });

  test('does not load routes with non-server renderingDisposition', async () => {
    const dataLoaderMock = vi.fn();

    const route = createRoute({
      pathname: '/aaa',
      dataLoader: dataLoaderMock,
      renderingDisposition: 'client',
    });

    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(dataLoaderMock).not.toHaveBeenCalled();
  });
});

describe('nextHydrationScript', () => {
  test('returns an empty string if there no changes in state', () => {
    const router = new SSRRouter({ routes: [] });

    expect(router.nextHydrationScript()).toBe('');
  });

  test('returns the hydration script for a single route', async () => {
    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(router.nextHydrationScript()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('returns the hydration script for nested routes', async () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute(routeAaa, '/aaa');
    const router = new SSRRouter({ routes: [routeBbb] });

    router.navigate(routeBbb);

    expect(router.nextHydrationScript()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\"}");s.set(1,"{\\"status\\":\\"ready\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('returns only changed route states in consequent hydration scripts', async () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute(routeAaa, '/aaa');
    const router = new SSRRouter({ routes: [routeBbb] });

    router.navigate(routeBbb);
    router.nextHydrationScript();

    router.rootController!.childController!.setData('xxx');

    expect(router.nextHydrationScript()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(1,"{\\"status\\":\\"ready\\",\\"data\\":\\"xxx\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('respects stateStringifier option', () => {
    const stateStringifierMock = vi.fn(JSON.stringify);

    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route], stateStringifier: stateStringifierMock });

    router.navigate(route);

    router.nextHydrationScript();

    expect(stateStringifierMock).toHaveBeenCalledTimes(1);
    expect(stateStringifierMock).toHaveBeenNthCalledWith(1, { status: 'ready', data: undefined });
  });

  test('escapes XSS-prone strings', () => {
    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);
    router.rootController!.setData('<script src="https://xxx.yyy"></script>');

    expect(router.nextHydrationScript()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\",\\"data\\":\\"\\u003Cscript src=\\\\\\"https://xxx.yyy\\\\\\">\\u003C/script>\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });
});

describe('nextHydrationChunk', () => {
  test('returns an empty string if there no changes in state', () => {
    const router = new SSRRouter({ routes: [] });

    expect(router.nextHydrationChunk()).toBe('');
  });

  test('returns the hydration script for a single route', async () => {
    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(router.nextHydrationChunk()).toBe(
      '<script>var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
    );
  });

  test('respects nonce', () => {
    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route], nonce: '111' });

    router.navigate(route);

    expect(router.nextHydrationChunk()).toBe(
      '<script nonce="111">var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
    );
  });
});

describe('hasChanges', () => {
  test('returns false if there are no pending routes', async () => {
    const router = new SSRRouter({ routes: [] });

    await expect(router.hasChanges()).resolves.toBe(false);
  });

  test('waits for pending executors to finish', async () => {
    const route = createRoute({
      pathname: '/aaa',
      dataLoader: () => Promise.resolve('zzz'),
    });

    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(router.rootController!['_state'].status).toBe('loading');

    await expect(router.hasChanges()).resolves.toBe(true);

    expect(router.rootController!['_state'].status).toBe('ready');
  });

  describe('abort', () => {
    test('aborts root controller', async () => {
      const route = createRoute({
        pathname: '/aaa',
        dataLoader: () => Promise.resolve('zzz'),
      });

      const router = new SSRRouter({ routes: [route] });

      router.navigate(route);

      const promise = router.rootController!.promise;

      router.abort('xxx');

      expect(router.rootController!['_state']).toStrictEqual({ status: 'error', error: 'xxx' } satisfies RouteState);
      expect(router.rootController!.promise).toBeNull();
      await expect(promise).rejects.toBe('xxx');
    });
  });
});
