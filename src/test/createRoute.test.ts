import { createRoute, Outlet, Route } from '../main';

const Component = () => null;

test('no args signature', () => {
  expect(createRoute()).toBeInstanceOf(Route);
  expect(createRoute().parentRoute).toBeNull();
});

test('(options) signature', () => {
  const route = createRoute('/rrr');

  expect(route.parentRoute).toBeNull();
  expect(route.pathnameTemplate.pattern).toBe('/rrr');
  expect(route.getOrLoadComponent()).toBe(Outlet);
});

test('(parentRoute) signature', () => {
  const aaaRoute = createRoute();
  const route = createRoute(aaaRoute);

  expect(route.parentRoute).toBe(aaaRoute);
  expect(route.pathnameTemplate.pattern).toBe('/');
  expect(route.getOrLoadComponent()).toBe(Outlet);
});

test('(parentRoute, options) signature', () => {
  const aaaRoute = createRoute();
  const route = createRoute(aaaRoute, '/rrr');

  expect(route.parentRoute).toBe(aaaRoute);
  expect(route.pathnameTemplate.pattern).toBe('/rrr');
  expect(route.getOrLoadComponent()).toBe(Outlet);
});

test('(pathname) signature', () => {
  const route = createRoute('/rrr');

  expect(route.parentRoute).toBeNull();
  expect(route.pathnameTemplate.pattern).toBe('/rrr');
  expect(route.getOrLoadComponent()).toBe(Outlet);
});

test('(pathname, component) signature', () => {
  const route = createRoute('/rrr', Component);

  expect(route.parentRoute).toBeNull();
  expect(route.pathnameTemplate.pattern).toBe('/rrr');
  expect(route.getOrLoadComponent()).toBe(Component);
});

test('(parentRoute, pathname) signature', () => {
  const aaaRoute = createRoute();
  const route = createRoute(aaaRoute, '/rrr');

  expect(route.parentRoute).toBe(aaaRoute);
  expect(route.pathnameTemplate.pattern).toBe('/rrr');
  expect(route.getOrLoadComponent()).toBe(Outlet);
});

test('(parentRoute, pathname, component) signature', () => {
  const aaaRoute = createRoute();
  const route = createRoute(aaaRoute, '/rrr', Component);

  expect(route.parentRoute).toBe(aaaRoute);
  expect(route.pathnameTemplate.pattern).toBe('/rrr');
  expect(route.getOrLoadComponent()).toBe(Component);
});
