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
    expect(route['_pathnameMatcher']).toBeInstanceOf(Function);
    expect(route['_renderer']).toBeInstanceOf(Function);

    expect(route['_urlComposer']('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('creates a route with options', () => {
    const componentFetcher = () => Component;
    const route = new Route({ pathname: 'xxx', componentFetcher });

    expect(route['_paramsParser']).toBeUndefined();
    expect(route['_pathnameMatcher']).toBeInstanceOf(Function);
    expect(route['_renderer']).toBeInstanceOf(Function);

    expect(route['_urlComposer']('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('component loader is memoized', () => {
    const componentFetcherMock = jest.fn(() => Component);
    const route = new Route({ pathname: 'xxx', componentFetcher: componentFetcherMock });

    expect(isValidElement(route['_renderer']())).toBe(true);
    expect(route['_renderer']()).toEqual(route['_renderer']());

    expect(componentFetcherMock).toHaveBeenCalledTimes(1);
  });

  test('caches a component exported from a module', async () => {
    const componentFetcherMock = jest.fn(() => Promise.resolve({ default: Component }));
    const route = new Route({ pathname: 'xxx', componentFetcher: componentFetcherMock });

    const promise = route['_renderer']();

    expect(route['_renderer']()).toBe(promise);

    await promise;

    expect(isValidElement(route['_renderer']())).toBe(true);
    expect(route['_renderer']()).toBe(route['_renderer']());

    expect(componentFetcherMock).toHaveBeenCalledTimes(1);
  });

  test('infers urlComposer', () => {
    const route = new Route<{ aaa?: number }>({ pathname: 'xxx/:aaa', componentFetcher: () => Component });

    expect(() => route['_urlComposer']('yyy', {}, undefined, urlSearchParamsParser)).toThrow();
    expect(route['_urlComposer']('yyy', { aaa: 222 }, undefined, urlSearchParamsParser)).toBe('yyy/xxx/222');
  });

  test('throws if urlComposer cannot be inferred', () => {
    expect(() => new Route({ pathname: () => null, componentFetcher: () => Component })).toThrow();
  });
});
