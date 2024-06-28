// function Component1() {
//   return null;
// }
//
// function Component2() {
//   return null;
// }

// describe('Route', () => {
//   test('creates a route', () => {
//     const componentLoader = () => Component1;
//     const route = new Route('xxx', componentLoader);
//
//     expect(route['_paramsParser']).toBeUndefined();
//     expect(route['_render']).toBeInstanceOf(Function);
//
//     expect(route['_urlComposer']('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
//   });
//
//   test('creates a route with options', () => {
//     const componentLoader = () => Component1;
//     const route = new Route({ pathname: 'xxx', componentLoader });
//
//     expect(route['_paramsParser']).toBeUndefined();
//     expect(route['_render']).toBeInstanceOf(Function);
//
//     expect(route['_urlComposer']('yyy', undefined, undefined, urlSearchParamsParser)).toBe('yyy/xxx');
//   });
//
//   test('component componentLoader is memoized', () => {
//     const componentFetcherMock = jest.fn(() => Component1);
//     const route = new Route({ pathname: 'xxx', componentLoader: componentFetcherMock });
//
//     expect(isValidElement(route['_render']())).toBe(true);
//     expect(route['_render']()).toEqual(route['_render']());
//
//     expect(componentFetcherMock).toHaveBeenCalledTimes(1);
//   });
//
//   test('caches a component exported from a module', async () => {
//     const componentFetcherMock = jest.fn(() => Promise.resolve({ default: Component1 }));
//     const route = new Route({ pathname: 'xxx', componentLoader: componentFetcherMock });
//
//     const promise = route['_render']();
//
//     expect(route['_render']()).toBe(promise);
//
//     await promise;
//
//     expect(isValidElement(route['_render']())).toBe(true);
//     expect(route['_render']()).toBe(route['_render']());
//
//     expect(componentFetcherMock).toHaveBeenCalledTimes(1);
//   });
//
//   test('infers pathComposer', () => {
//     const route = new Route<{ aaa?: number }>({ pathname: 'xxx/:aaa', componentLoader: () => Component1 });
//
//     expect(() => route['_urlComposer']('yyy', {}, undefined, urlSearchParamsParser)).toThrow();
//     expect(route['_urlComposer']('yyy', { aaa: 222 }, undefined, urlSearchParamsParser)).toBe('yyy/xxx/222');
//   });
//
//   test('throws if pathComposer cannot be inferred', () => {
//     expect(() => new Route({ pathname: () => null, componentLoader: () => Component1 })).toThrow();
//   });
// });

describe('createPathnameMatcher', () => {
  test('matches without slashes', () => {
    //     const matcher = createPathnameMatcher('aaa');
    //
    //     expect(matcher('bbb')).toBeNull();
    //
    //     expect(matcher('aaa')).toEqual({ pathname: 'aaa', params: {} });
    //     expect(matcher('/aaa')).toEqual({ pathname: 'aaa', params: {} });
    //     expect(matcher('aaa/')).toEqual({ pathname: 'aaa', params: {} });
    //     expect(matcher('/aaa/')).toEqual({ pathname: 'aaa', params: {} });
    //   });
    //
    //   test('matches with leading slash', () => {
    //     const matcher = createPathnameMatcher('/aaa');
    //
    //     expect(matcher('aaa')).toEqual({ pathname: '/aaa', params: {} });
    //     expect(matcher('/aaa')).toEqual({ pathname: '/aaa', params: {} });
    //     expect(matcher('aaa/')).toEqual({ pathname: '/aaa', params: {} });
    //     expect(matcher('/aaa/')).toEqual({ pathname: '/aaa', params: {} });
    //   });
    //
    //   test('matches with trailing slash', () => {
    //     const matcher = createPathnameMatcher('aaa/');
    //
    //     expect(matcher('aaa')).toEqual({ pathname: 'aaa/', params: {} });
    //     expect(matcher('/aaa')).toEqual({ pathname: 'aaa/', params: {} });
    //     expect(matcher('aaa/')).toEqual({ pathname: 'aaa/', params: {} });
    //     expect(matcher('/aaa/')).toEqual({ pathname: 'aaa/', params: {} });
    //   });
    //
    //   test('matches with slashes', () => {
    //     const matcher = createPathnameMatcher('/aaa/');
    //
    //     expect(matcher('aaa')).toEqual({ pathname: '/aaa/', params: {} });
    //     expect(matcher('/aaa')).toEqual({ pathname: '/aaa/', params: {} });
    //     expect(matcher('aaa/')).toEqual({ pathname: '/aaa/', params: {} });
    //     expect(matcher('/aaa/')).toEqual({ pathname: '/aaa/', params: {} });
    //   });
    //
    //   test('matches with params', () => {
    //     const matcher = createPathnameMatcher('/:aaa/:bbb');
    //
    //     expect(matcher('xxx/yyy')).toEqual({ pathname: '/xxx/yyy', params: { aaa: 'xxx', bbb: 'yyy' } });
    //   });
    //
    //   test('matches with wildcard', () => {
    //     const matcher = createPathnameMatcher('/aaa/*/bbb');
    //
    //     expect(matcher('aaa/xxx/bbb')).toEqual({ pathname: '/aaa/xxx/bbb', params: { 0: 'xxx' } });
    //   });
    //
    //   test('matches with trailing wildcard', () => {
    //     const matcher = createPathnameMatcher('/aaa/*');
    //
    //     expect(matcher('aaa/xxx/yyy/')).toEqual({ pathname: '/aaa', params: { 0: 'xxx/yyy' }, nestedPathname: 'xxx/yyy' });
    //   });
    //
    //   test('matches with trailing wildcard with trailing slash', () => {
    //     const matcher = createPathnameMatcher('/aaa/*/');
    //
    //     expect(matcher('aaa/xxx/yyy')).toEqual({ pathname: '/aaa/xxx/yyy/', params: { 0: 'xxx/yyy' } });
    //   });
    // });
    //
    // describe('createURLComposer', () => {
    //   test('throws if pattern has non-capturing groups', () => {
    //     expect(() => createURLComposer('/{aaa}')).toThrow();
    //   });
    //
    //   test('throws if pattern has regexp groups', () => {
    //     expect(() => createURLComposer('/(aaa)')).toThrow();
    //   });
    //
    //   test('throws if pattern has non-trailing wildcards', () => {
    //     expect(() => createURLComposer('/*')).not.toThrow();
    //     expect(() => createURLComposer('/**')).not.toThrow();
    //     expect(() => createURLComposer('/*/aaa')).toThrow();
    //   });
    //
    //   test('trims wildcard', () => {
    //     expect(createURLComposer('/aaa/*')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    //   });
    //
    //   test('composes a URL', () => {
    //     expect(createURLComposer('/aaa')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    //     expect(createURLComposer('aaa')('xxx/', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    //     expect(createURLComposer('aaa')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    //   });
    //
    //   test('injects params into the pathname', () => {
    //     const urlComposer = createURLComposer('/:aaa/:bbb');
    //
    //     expect(urlComposer('xxx', { aaa: 111, bbb: 222 }, undefined, urlSearchParamsParser)).toBe('xxx/111/222');
    //     expect(urlComposer('xxx', { aaa: ' ', bbb: '\n' }, undefined, urlSearchParamsParser)).toBe('xxx/%20/%0A');
    //   });
    //
    //   test('throws if pathname param is missing', () => {
    //     const urlComposer = createURLComposer('/:aaa/:bbb');
    //
    //     expect(() => urlComposer('xxx', { aaa: 111 }, undefined, urlSearchParamsParser)).toThrow();
    //   });
    //
    //   test('appends search', () => {
    //     const urlComposer = createURLComposer('yyy');
    //
    //     expect(urlComposer('xxx', { aaa: 111 }, undefined, urlSearchParamsParser)).toBe('xxx/yyy?aaa=111');
    //   });
    //
    //   test('appends hash', () => {
    //     const urlComposer = createURLComposer('yyy');
    //
    //     expect(urlComposer('xxx', {}, 'aaa', urlSearchParamsParser)).toBe('xxx/yyy#aaa');
    //     expect(urlComposer('xxx', {}, '#aaa', urlSearchParamsParser)).toBe('xxx/yyy#aaa');
    //     expect(urlComposer('xxx', {}, '#', urlSearchParamsParser)).toBe('xxx/yyy');
    //   });
    // });
    //
    // describe('matchRoute', () => {
    //   test('matches a route', () => {
    //     const route1 = new Route('aaa', () => Component1);
    //     const route2 = new Route('bbb', () => Component2);
    //
    //     expect(matchRoute('aaa', {}, [route1, route2])).toEqual({ route: route1, pathname: 'aaa' });
    //     expect(matchRoute('bbb', {}, [route1, route2])).toEqual({ route: route2, pathname: 'bbb' });
    //     expect(matchRoute('/aaa', {}, [route1, route2])).toEqual({ route: route1, pathname: 'aaa' });
    //     expect(matchRoute('/bbb', {}, [route1, route2])).toEqual({ route: route2, pathname: 'bbb' });
    //   });
    //
    //   test('matches a route with pathname params', () => {
    //     const route = new Route({
    //       pathname: 'aaa/:xxx',
    //       componentLoader: () => Component1,
    //       paramsParser: rawParams => rawParams,
    //     });
    //
    //     expect(matchRoute('aaa/yyy', {}, [route])).toEqual({
    //       route,
    //       pathname: 'aaa/yyy',
    //       params: { xxx: 'yyy' },
    //     });
    //   });
    //
    //   test('matches a route with pathname params but does not return them by default', () => {
    //     const route = new Route({
    //       pathname: 'aaa/:xxx',
    //       componentLoader: () => Component1,
    //     });
    //
    //     expect(matchRoute('aaa/yyy', {}, [route])).toEqual({
    //       route,
    //       pathname: 'aaa/yyy',
    //     });
    //   });
    //
    //   test('matches a route with search params', () => {
    //     const route = new Route({
    //       pathname: 'aaa',
    //       componentLoader: () => Component1,
    //       paramsParser: rawParams => rawParams,
    //     });
    //
    //     expect(matchRoute('aaa', { xxx: 'yyy' }, [route])).toEqual({
    //       route,
    //       pathname: 'aaa',
    //       params: { xxx: 'yyy' },
    //     });
    //   });
    //
    //   test('matches a route with search params but does not return them by default', () => {
    //     const route = new Route({
    //       pathname: 'aaa',
    //       componentLoader: () => Component1,
    //     });
    //
    //     expect(matchRoute('aaa', { xxx: 'yyy' }, [route])).toEqual({
    //       route,
    //       pathname: 'aaa',
    //     });
    //   });
    //
    //   test('returns both pathname and search params', () => {
    //     const route = new Route({
    //       pathname: 'aaa/:xxx',
    //       componentLoader: () => Component1,
    //       paramsParser: rawParams => rawParams,
    //     });
    //
    //     expect(matchRoute('aaa/yyy', { ppp: 'qqq' }, [route])).toEqual({
    //       route,
    //       pathname: 'aaa/yyy',
    //       params: { ppp: 'qqq', xxx: 'yyy' },
    //     });
    //   });
    //
    //   test('pathname params have precedence over search params', () => {
    //     const route = new Route({
    //       pathname: 'aaa/:xxx',
    //       componentLoader: () => Component1,
    //       paramsParser: rawParams => rawParams,
    //     });
    //
    //     expect(matchRoute('aaa/yyy', { xxx: 'zzz' }, [route])).toEqual({
    //       route,
    //       pathname: 'aaa/yyy',
    //       params: { xxx: 'yyy' },
    //     });
  });
});
