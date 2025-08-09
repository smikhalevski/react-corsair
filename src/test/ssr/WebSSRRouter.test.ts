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

describe('nextHydrationSourceCode', () => {
  test('returns not found hydration script', () => {
    const router = new SSRRouter({ routes: [] });

    expect(router.nextHydrationSourceCode()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"not_found\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('returns the hydration script for a single route', async () => {
    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(router.nextHydrationSourceCode()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('returns the hydration script for nested routes', async () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute(routeAaa, '/aaa');
    const router = new SSRRouter({ routes: [routeBbb] });

    router.navigate(routeBbb);

    expect(router.nextHydrationSourceCode()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\"}");s.set(1,"{\\"status\\":\\"ready\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('returns only changed route states in consequent hydration scripts', async () => {
    const routeAaa = createRoute('/aaa');
    const routeBbb = createRoute(routeAaa, '/aaa');
    const router = new SSRRouter({ routes: [routeBbb] });

    router.navigate(routeBbb);
    router.nextHydrationSourceCode();

    router.rootController.childController!.setData('xxx');

    expect(router.nextHydrationSourceCode()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(1,"{\\"status\\":\\"ready\\",\\"data\\":\\"xxx\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });

  test('uses custom serializer', () => {
    const serializerMock = {
      parse: vi.fn(JSON.parse),
      stringify: vi.fn(JSON.stringify),
    };

    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route], serializer: serializerMock });

    router.navigate(route);

    router.nextHydrationSourceCode();

    expect(serializerMock.stringify).toHaveBeenCalledTimes(1);
    expect(serializerMock.stringify).toHaveBeenNthCalledWith(1, { status: 'ready', data: undefined });
  });

  test('escapes XSS-prone strings', () => {
    const route = createRoute('/aaa');
    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);
    router.rootController.setData('<script src="https://xxx.yyy"></script>');

    expect(router.nextHydrationSourceCode()).toBe(
      'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\",\\"data\\":\\"\\u003Cscript src=\\\\\\"https://xxx.yyy\\\\\\">\\u003C/script>\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);'
    );
  });
});

describe('nextHydrationChunk', () => {
  test('returns not found hydration script', () => {
    const router = new SSRRouter({ routes: [] });

    expect(router.nextHydrationChunk()).toBe(
      '<script>var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"not_found\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
    );
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
  test('returns true for not found route', async () => {
    const router = new SSRRouter({ routes: [] });

    await expect(router.hasChanges()).resolves.toBe(true);
  });

  test('waits for pending executors to finish', async () => {
    const route = createRoute({
      pathname: '/aaa',
      dataLoader: () => Promise.resolve('zzz'),
    });

    const router = new SSRRouter({ routes: [route] });

    router.navigate(route);

    expect(router.rootController['_state'].status).toBe('loading');

    await expect(router.hasChanges()).resolves.toBe(true);

    expect(router.rootController['_state'].status).toBe('ready');
  });

  describe('abort', () => {
    test('aborts root controller', async () => {
      const route = createRoute({
        pathname: '/aaa',
        dataLoader: () => Promise.resolve('zzz'),
      });

      const router = new SSRRouter({ routes: [route] });

      router.navigate(route);

      const promise = router.rootController.promise;

      router.abort('xxx');

      expect(router.rootController['_state']).toStrictEqual({ status: 'error', error: 'xxx' } satisfies RouteState);
      expect(router.rootController.promise).toBeNull();
      await expect(promise).rejects.toBe('xxx');
    });
  });
});
