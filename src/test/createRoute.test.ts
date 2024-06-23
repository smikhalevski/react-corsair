import { createRoute } from '../main/createRoute';
import { urlSearchParamsParser } from '../main/urlSearchParamsParser';

describe('createRoute', () => {
  test('creates a route', () => {
    const resolver = () => 111;
    const route = createRoute('xxx', resolver);

    expect(route.paramsParser).toBeUndefined();
    expect(route.searchParamsParser).toBeUndefined();
    expect(route.pathnameMatcher).toBeInstanceOf(Function);

    expect(route.resolver).toBeInstanceOf(Function);
    expect(route.resolver).toBe(resolver);

    expect(route.urlComposer('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('creates a route with options', () => {
    const resolver = () => 111;
    const route = createRoute({ pathname: 'xxx', resolver });

    expect(route.paramsParser).toBeUndefined();
    expect(route.searchParamsParser).toBeUndefined();
    expect(route.pathnameMatcher).toBeInstanceOf(Function);

    expect(route.resolver).toBeInstanceOf(Function);
    expect(route.resolver).toBe(resolver);

    expect(route.urlComposer('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
  });

  test('creates a cacheable route', () => {
    const resolverMock = jest.fn(() => 111);
    const route = createRoute({ pathname: 'xxx', resolver: resolverMock, cacheable: true });

    expect(route.resolver(undefined)).toBe(111);
    expect(route.resolver(undefined)).toBe(111);
    expect(route.resolver(undefined)).toBe(111);

    expect(resolverMock).toHaveBeenCalledTimes(1);
  });

  test('creates a non-cacheable route', () => {
    const resolverMock = jest.fn(() => 111);
    const route = createRoute({ pathname: 'xxx', resolver: resolverMock, cacheable: false });

    expect(route.resolver(undefined)).toBe(111);
    expect(route.resolver(undefined)).toBe(111);
    expect(route.resolver(undefined)).toBe(111);

    expect(resolverMock).toHaveBeenCalledTimes(3);
  });

  test('caches a promise result', async () => {
    const resolverMock = jest.fn(() => Promise.resolve(111));
    const route = createRoute({ pathname: 'xxx', resolver: resolverMock, cacheable: true });

    const promise = route.resolver(undefined);

    expect(route.resolver(undefined)).toBe(promise);

    await promise;

    expect(route.resolver(undefined)).toBe(111);
    expect(resolverMock).toHaveBeenCalledTimes(1);
  });

  test('does not cache sync undefined result', () => {
    const resolverMock = jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(111).mockReturnValue(222);
    const route = createRoute({ pathname: 'xxx', resolver: resolverMock, cacheable: true });

    expect(route.resolver(undefined)).toBe(undefined);
    expect(route.resolver(undefined)).toBe(111);
    expect(route.resolver(undefined)).toBe(111);

    expect(resolverMock).toHaveBeenCalledTimes(2);
  });

  test('does not cache async undefined result', async () => {
    const resolverMock = jest
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(Promise.resolve(111))
      .mockReturnValue(222);

    const route = createRoute({ pathname: 'xxx', resolver: resolverMock, cacheable: true });

    expect(route.resolver(undefined)).toBe(undefined);

    const promise = route.resolver(undefined);

    expect(route.resolver(undefined)).toBe(promise);

    await promise;

    expect(route.resolver(undefined)).toBe(111);
    expect(resolverMock).toHaveBeenCalledTimes(2);
  });

  test('infers urlComposer', () => {
    const route = createRoute({ pathname: 'xxx/:aaa', resolver: (_params: { aaa?: number }) => 111 });

    expect(() => route.urlComposer('yyy', {}, undefined, urlSearchParamsParser)).toThrow();
    expect(route.urlComposer('yyy', { aaa: 222 }, undefined, urlSearchParamsParser)).toBe('yyy/xxx/222');
  });

  test('throws if urlComposer cannot be inferred', () => {
    expect(() => createRoute({ pathname: () => undefined, resolver: () => 111 })).toThrow();
  });
});
