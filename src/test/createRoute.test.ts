import { createRoute, Outlet, Route } from '../main';

describe('createRoute', () => {
  const Component = () => null;

  test('no args signature', () => {
    expect(createRoute()).toBeInstanceOf(Route);
    expect(createRoute().parent).toBeNull();
  });

  test('(options) signature', () => {
    const route = createRoute('/rrr');

    expect(route.parent).toBeNull();
    expect(route.pathnameTemplate.pattern).toBe('/rrr');
    expect(route.getComponent()).toBe(Outlet);
  });

  test('(parentRoute) signature', () => {
    const aaaRoute = createRoute();
    const route = createRoute(aaaRoute);

    expect(route.parent).toBe(aaaRoute);
    expect(route.pathnameTemplate.pattern).toBe('/');
    expect(route.getComponent()).toBe(Outlet);
  });

  test('(parentRoute, options) signature', () => {
    const aaaRoute = createRoute();
    const route = createRoute(aaaRoute, '/rrr');

    expect(route.parent).toBe(aaaRoute);
    expect(route.pathnameTemplate.pattern).toBe('/rrr');
    expect(route.getComponent()).toBe(Outlet);
  });

  test('(pathname) signature', () => {
    const route = createRoute('/rrr');

    expect(route.parent).toBeNull();
    expect(route.pathnameTemplate.pattern).toBe('/rrr');
    expect(route.getComponent()).toBe(Outlet);
  });

  test('(pathname, component) signature', () => {
    const route = createRoute('/rrr', Component);

    expect(route.parent).toBeNull();
    expect(route.pathnameTemplate.pattern).toBe('/rrr');
    expect(route.getComponent()).toBe(Component);
  });

  test('(parentRoute, pathname) signature', () => {
    const aaaRoute = createRoute();
    const route = createRoute(aaaRoute, '/rrr');

    expect(route.parent).toBe(aaaRoute);
    expect(route.pathnameTemplate.pattern).toBe('/rrr');
    expect(route.getComponent()).toBe(Outlet);
  });

  test('(parentRoute, pathname, component) signature', () => {
    const aaaRoute = createRoute();
    const route = createRoute(aaaRoute, '/rrr', Component);

    expect(route.parent).toBe(aaaRoute);
    expect(route.pathnameTemplate.pattern).toBe('/rrr');
    expect(route.getComponent()).toBe(Component);
  });
});
