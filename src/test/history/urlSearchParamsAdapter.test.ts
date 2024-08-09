import { urlSearchParamsAdapter } from '../../main/history/urlSearchParamsAdapter';

describe('urlSearchParamsAdapter', () => {
  test('parses params', () => {
    expect(urlSearchParamsAdapter.parse('aaa=bbb')).toStrictEqual({ aaa: 'bbb' });
    expect(urlSearchParamsAdapter.parse('aaa=bbb&aaa=ccc')).toStrictEqual({ aaa: ['bbb', 'ccc'] });
    expect(urlSearchParamsAdapter.parse('aaa=bbb%2C111&aaa=ccc%2C222')).toStrictEqual({ aaa: ['bbb,111', 'ccc,222'] });
  });

  test('stringifies params', () => {
    expect(urlSearchParamsAdapter.stringify({ aaa: 'bbb' })).toBe('aaa=bbb');
    expect(urlSearchParamsAdapter.stringify({ aaa: ['bbb', 'ccc'] })).toBe('aaa=bbb&aaa=ccc');
    expect(urlSearchParamsAdapter.stringify({ aaa: new Set(['bbb', 'ccc']) })).toBe('aaa=bbb&aaa=ccc');
  });

  test('throws if param cannot be stringified', () => {
    expect(() => urlSearchParamsAdapter.stringify({ aaa: new Map() })).toThrow(
      new TypeError('Unsupported param value type: aaa')
    );
  });
});
