import { inferURLComposer } from '../main/inferURLComposer';
import { urlSearchParamsParser } from '../main/urlSearchParamsParser';

describe('inferURLComposer', () => {
  test('throws if pattern has non-capturing groups', () => {
    expect(() => inferURLComposer('/{aaa}')).toThrow();
  });

  test('throws if pattern has regexp groups', () => {
    expect(() => inferURLComposer('/(aaa)')).toThrow();
  });

  test('throws if pattern has non-trailing wildcards', () => {
    expect(() => inferURLComposer('/*')).not.toThrow();
    expect(() => inferURLComposer('/**')).not.toThrow();
    expect(() => inferURLComposer('/*/aaa')).toThrow();
  });

  test('trims wildcard', () => {
    expect(inferURLComposer('/aaa/*')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
  });

  test('composes a URL', () => {
    expect(inferURLComposer('/aaa')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    expect(inferURLComposer('aaa')('xxx/', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
    expect(inferURLComposer('aaa')('xxx', {}, undefined, urlSearchParamsParser)).toBe('xxx/aaa');
  });

  test('injects params into the pathname', () => {
    const urlComposer = inferURLComposer('/:aaa/:bbb');

    expect(urlComposer('xxx', { aaa: 111, bbb: 222 }, undefined, urlSearchParamsParser)).toBe('xxx/111/222');
    expect(urlComposer('xxx', { aaa: ' ', bbb: '\n' }, undefined, urlSearchParamsParser)).toBe('xxx/%20/%0A');
  });

  test('throws if pathname param is missing', () => {
    const urlComposer = inferURLComposer('/:aaa/:bbb');

    expect(() => urlComposer('xxx', { aaa: 111 }, undefined, urlSearchParamsParser)).toThrow();
  });

  test('appends search', () => {
    const urlComposer = inferURLComposer('yyy');

    expect(urlComposer('xxx', { aaa: 111 }, undefined, urlSearchParamsParser)).toBe('xxx/yyy?aaa=111');
  });

  test('appends fragment', () => {
    const urlComposer = inferURLComposer('yyy');

    expect(urlComposer('xxx', {}, 'aaa', urlSearchParamsParser)).toBe('xxx/yyy#aaa');
    expect(urlComposer('xxx', {}, '#aaa', urlSearchParamsParser)).toBe('xxx/yyy#aaa');
    expect(urlComposer('xxx', {}, '#', urlSearchParamsParser)).toBe('xxx/yyy');
  });
});
