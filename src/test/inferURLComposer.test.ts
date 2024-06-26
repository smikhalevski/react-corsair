import { createURLComposer } from '../main/Route';
import { urlSearchParamsParser } from '../main/urlSearchParamsParser';

describe('createURLComposer', () => {
  test('throws if pattern has non-capturing groups', () => {
    expect(() => createURLComposer('/{aaa}')).toThrow();
  });

  test('throws if pattern has regexp groups', () => {
    expect(() => createURLComposer('/(aaa)')).toThrow();
  });

  test('throws if pattern has non-trailing wildcards', () => {
    expect(() => createURLComposer('/*')).not.toThrow();
    expect(() => createURLComposer('/**')).not.toThrow();
    expect(() => createURLComposer('/*/aaa')).toThrow();
  });

  test('trims wildcard', () => {
    expect(createURLComposer('/aaa/*')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
  });

  test('composes a URL', () => {
    expect(createURLComposer('/aaa')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    expect(createURLComposer('aaa')('xxx/', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    expect(createURLComposer('aaa')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
  });

  test('injects params into the pathname', () => {
    const urlComposer = createURLComposer('/:aaa/:bbb');

    expect(urlComposer('xxx', { aaa: 111, bbb: 222 }, undefined, urlSearchParamsParser)).toBe('xxx/111/222');
    expect(urlComposer('xxx', { aaa: ' ', bbb: '\n' }, undefined, urlSearchParamsParser)).toBe('xxx/%20/%0A');
  });

  test('throws if pathname param is missing', () => {
    const urlComposer = createURLComposer('/:aaa/:bbb');

    expect(() => urlComposer('xxx', { aaa: 111 }, undefined, urlSearchParamsParser)).toThrow();
  });

  test('appends search', () => {
    const urlComposer = createURLComposer('yyy');

    expect(urlComposer('xxx', { aaa: 111 }, undefined, urlSearchParamsParser)).toBe('xxx/yyy?aaa=111');
  });

  test('appends fragment', () => {
    const urlComposer = createURLComposer('yyy');

    expect(urlComposer('xxx', {}, 'aaa', urlSearchParamsParser)).toBe('xxx/yyy#aaa');
    expect(urlComposer('xxx', {}, '#aaa', urlSearchParamsParser)).toBe('xxx/yyy#aaa');
    expect(urlComposer('xxx', {}, '#', urlSearchParamsParser)).toBe('xxx/yyy');
  });
});
