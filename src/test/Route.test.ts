import { isValidElement } from 'react';
import { Route } from '../main/Route';
import { urlSearchParamsParser } from '../main/urlSearchParamsParser';

function Component() {
  return null;
}

describe('new Route', () => {
  test('creates a route', () => {
    const componentFetcher = () => Component;
    const route = new Route('xxx', componentFetcher);

    expect(route['_paramsParser']).toBeUndefined();
    expect(route['_matcher']).toBeInstanceOf(Function);
    expect(route['_render']).toBeInstanceOf(Function);

    expect(route['_urlComposer']('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('creates a route with options', () => {
    const componentFetcher = () => Component;
    const route = new Route({ pathname: 'xxx', componentLoader: componentFetcher });

    expect(route['_paramsParser']).toBeUndefined();
    expect(route['_matcher']).toBeInstanceOf(Function);
    expect(route['_render']).toBeInstanceOf(Function);

    expect(route['_urlComposer']('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('component loader is memoized', () => {
    const componentFetcherMock = jest.fn(() => Component);
    const route = new Route({ pathname: 'xxx', componentLoader: componentFetcherMock });

    expect(isValidElement(route['_render']())).toBe(true);
    expect(route['_render']()).toEqual(route['_render']());

    expect(componentFetcherMock).toHaveBeenCalledTimes(1);
  });

  test('caches a component exported from a module', async () => {
    const componentFetcherMock = jest.fn(() => Promise.resolve({ default: Component }));
    const route = new Route({ pathname: 'xxx', componentLoader: componentFetcherMock });

    const promise = route['_render']();

    expect(route['_render']()).toBe(promise);

    await promise;

    expect(isValidElement(route['_render']())).toBe(true);
    expect(route['_render']()).toBe(route['_render']());

    expect(componentFetcherMock).toHaveBeenCalledTimes(1);
  });

  test('infers urlComposer', () => {
    const route = new Route<{ aaa?: number }>({ pathname: 'xxx/:aaa', componentLoader: () => Component });

    expect(() => route['_urlComposer']('yyy', {}, undefined, urlSearchParamsParser)).toThrow();
    expect(route['_urlComposer']('yyy', { aaa: 222 }, undefined, urlSearchParamsParser)).toBe('yyy/xxx/222');
  });

  test('throws if urlComposer cannot be inferred', () => {
    expect(() => new Route({ pathname: () => null, componentLoader: () => Component })).toThrow();
  });
});
