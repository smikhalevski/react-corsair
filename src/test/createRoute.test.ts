import { createRoute } from '../main/createRoute';
import { urlSearchParamsParser } from '../main/urlSearchParamsParser';

function Component() {
  return null;
}

describe('createRoute', () => {
  test('creates a route', () => {
    const componentLoader = () => Component;
    const route = createRoute('xxx', componentLoader);

    expect(route.paramsParser).toBeUndefined();
    expect(route.dataLoader).toBeUndefined();
    expect(route.pathnameMatcher).toBeInstanceOf(Function);
    expect(route.componentLoader).toBeInstanceOf(Function);

    expect(route.urlComposer('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('creates a route with options', () => {
    const componentLoader = () => Component;
    const route = createRoute({ pathname: 'xxx', componentLoader });

    expect(route.paramsParser).toBeUndefined();
    expect(route.dataLoader).toBeUndefined();
    expect(route.pathnameMatcher).toBeInstanceOf(Function);
    expect(route.componentLoader).toBeInstanceOf(Function);

    expect(route.urlComposer('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('component loader is memoized', () => {
    const componentLoaderMock = jest.fn(() => Component);
    const route = createRoute({ pathname: 'xxx', componentLoader: componentLoaderMock });

    expect(route.componentLoader()).toEqual(expect.objectContaining({ $$typeof: expect.any(Symbol) }));
    expect(route.componentLoader()).toEqual(route.componentLoader());

    expect(componentLoaderMock).toHaveBeenCalledTimes(1);
  });

  test('caches a component exported from a module', async () => {
    const componentLoaderMock = jest.fn(() => Promise.resolve({ default: Component }));
    const route = createRoute({ pathname: 'xxx', componentLoader: componentLoaderMock });

    const promise = route.componentLoader();

    expect(route.componentLoader()).toBe(promise);

    await promise;

    expect(route.componentLoader()).toEqual(expect.objectContaining({ $$typeof: expect.any(Symbol) }));
    expect(route.componentLoader()).toBe(route.componentLoader());

    expect(componentLoaderMock).toHaveBeenCalledTimes(1);
  });

  test('infers urlComposer', () => {
    const route = createRoute<{ aaa?: number }>({ pathname: 'xxx/:aaa', componentLoader: () => Component });

    expect(() => route.urlComposer('yyy', {}, undefined, urlSearchParamsParser)).toThrow();
    expect(route.urlComposer('yyy', { aaa: 222 }, undefined, urlSearchParamsParser)).toBe('yyy/xxx/222');
  });

  test('throws if urlComposer cannot be inferred', () => {
    expect(() => createRoute({ pathname: () => null, componentLoader: () => Component })).toThrow();
  });
});
