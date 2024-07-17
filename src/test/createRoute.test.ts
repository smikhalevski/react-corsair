import { createRoute, Route } from '../main';

describe('createRoute', () => {
  test('creates a route without a parent', () => {
    expect(createRoute()).toBeInstanceOf(Route);
    expect(createRoute().parent).toBeNull();
  });

  test('creates a route with a parent', () => {
    const aaaRoute = createRoute();

    expect(createRoute(aaaRoute).parent).toBe(aaaRoute);
  });
});
