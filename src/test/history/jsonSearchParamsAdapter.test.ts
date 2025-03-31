import { jsonSearchParamsAdapter as adapter } from '../../main';

describe('jsonSearchParamsAdapter', () => {
  test('stringifies search params', () => {
    expect(adapter.stringify({})).toBe('');
    expect(adapter.stringify({ aaa: 111 })).toBe('aaa=111');
    expect(adapter.stringify({ aaa: NaN })).toBe('aaa=null');
    expect(adapter.stringify({ aaa: Infinity })).toBe('aaa=null');
    expect(adapter.stringify({ aaa: 'xxx' })).toBe('aaa=xxx');
    expect(adapter.stringify({ aaa: 'xxx yyy' })).toBe('aaa=xxx+yyy');
    expect(adapter.stringify({ aaa: 'true' })).toBe('aaa=%22true%22');
    expect(adapter.stringify({ aaa: true })).toBe('aaa=true');
    expect(adapter.stringify({ aaa: [] })).toBe('aaa=%5B%5D');
    expect(adapter.stringify({ aaa: [111, 222] })).toBe('aaa=%5B111%2C222%5D');
    expect(adapter.stringify({ aaa: { bbb: 111 } })).toBe('aaa=%7B%22bbb%22%3A111%7D');
    expect(adapter.stringify({ aaa: 'null' })).toBe('aaa=%22null%22');
    expect(adapter.stringify({ aaa: null })).toBe('aaa=null');
    expect(adapter.stringify({ aaa: undefined })).toBe('');
    expect(adapter.stringify({ aaa: { toJSON: () => null } })).toBe('aaa=null');
    expect(adapter.stringify({ aaa: { toJSON: () => true } })).toBe('aaa=true');
    expect(adapter.stringify({ aaa: { toJSON: () => 'true' } })).toBe('aaa=%22true%22');
    expect(adapter.stringify({ aaa: new String('null') })).toBe('aaa=%22null%22');
  });

  test('parses search params', () => {
    expect(adapter.parse(adapter.stringify({}))).toStrictEqual({});
    expect(adapter.parse(adapter.stringify({ aaa: 111 }))).toStrictEqual({ aaa: 111 });
    expect(adapter.parse(adapter.stringify({ aaa: NaN }))).toStrictEqual({ aaa: null });
    expect(adapter.parse(adapter.stringify({ aaa: Infinity }))).toStrictEqual({ aaa: null });
    expect(adapter.parse(adapter.stringify({ aaa: 'xxx' }))).toStrictEqual({ aaa: 'xxx' });
    expect(adapter.parse(adapter.stringify({ aaa: 'true' }))).toStrictEqual({ aaa: 'true' });
    expect(adapter.parse(adapter.stringify({ aaa: true }))).toStrictEqual({ aaa: true });
    expect(adapter.parse(adapter.stringify({ aaa: [] }))).toStrictEqual({ aaa: [] });
    expect(adapter.parse(adapter.stringify({ aaa: [111, 222] }))).toStrictEqual({ aaa: [111, 222] });
    expect(adapter.parse(adapter.stringify({ aaa: { bbb: 111 } }))).toStrictEqual({ aaa: { bbb: 111 } });
    expect(adapter.parse(adapter.stringify({ aaa: null }))).toStrictEqual({ aaa: null });
    expect(adapter.parse(adapter.stringify({ aaa: undefined }))).toStrictEqual({});
  });

  test('only the first param value is used during parsing', () => {
    expect(adapter.parse('aaa=true&aaa=false')).toStrictEqual({ aaa: true });
  });
});
