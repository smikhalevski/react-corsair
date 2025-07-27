import { expect, test } from 'vitest';
import { NotFoundRouteController } from '../main/NotFoundRouteController.js';
import { NotFoundError, Router } from '../main/index.js';

test('creates a new RouteController', () => {
  const controller = new NotFoundRouteController(new Router({ routes: [] }), '/hello');

  expect(controller['_state']).toEqual({ status: 'not_found' });
  expect(controller['_error']).toBeInstanceOf(NotFoundError);
  expect(controller.route.pathnameTemplate.pattern).toBe('/hello');
});

test('escapes pathname special chars', () => {
  const controller = new NotFoundRouteController(new Router({ routes: [] }), '/:hello*?');

  expect(controller.route.pathnameTemplate.paramNames.size).toBe(0);
  expect(controller.route.getLocation()).toEqual({
    hash: '',
    pathname: '/%3ahello%2a%3f',
    searchParams: {},
    state: undefined,
  });
});

test('does not load data', () => {
  const controller = new NotFoundRouteController(new Router({ routes: [] }), '');

  controller.setData();

  expect(controller.status).toBe('not_found');
  expect(controller.promise).toBe(null);
  expect(() => controller.data).toThrow(new Error('The route data is unavailable: not_found'));
});

test('setData clears error', () => {
  const controller = new NotFoundRouteController(new Router({ routes: [] }), '');
  const error = new Error('Expected');

  controller.setError(error);

  expect(controller.status).toBe('error');
  expect(controller.error).toBe(error);

  controller.setData();

  expect(controller.status).toBe('not_found');
  expect(controller.error).toBeUndefined();
});
