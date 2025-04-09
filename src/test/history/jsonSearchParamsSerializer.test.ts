import { jsonSearchParamsSerializer } from '../../main/history';

test('stringifies search params', () => {
  expect(jsonSearchParamsSerializer.stringify({})).toBe('');
  expect(jsonSearchParamsSerializer.stringify({ aaa: 111 })).toBe('aaa=111');
  expect(jsonSearchParamsSerializer.stringify({ aaa: NaN })).toBe('aaa=null');
  expect(jsonSearchParamsSerializer.stringify({ aaa: Infinity })).toBe('aaa=null');
  expect(jsonSearchParamsSerializer.stringify({ aaa: 'xxx' })).toBe('aaa=xxx');
  expect(jsonSearchParamsSerializer.stringify({ aaa: 'xxx yyy' })).toBe('aaa=xxx+yyy');
  expect(jsonSearchParamsSerializer.stringify({ aaa: 'true' })).toBe('aaa=%22true%22');
  expect(jsonSearchParamsSerializer.stringify({ aaa: true })).toBe('aaa=true');
  expect(jsonSearchParamsSerializer.stringify({ aaa: [] })).toBe('aaa=%5B%5D');
  expect(jsonSearchParamsSerializer.stringify({ aaa: [111, 222] })).toBe('aaa=%5B111%2C222%5D');
  expect(jsonSearchParamsSerializer.stringify({ aaa: { bbb: 111 } })).toBe('aaa=%7B%22bbb%22%3A111%7D');
  expect(jsonSearchParamsSerializer.stringify({ aaa: 'null' })).toBe('aaa=%22null%22');
  expect(jsonSearchParamsSerializer.stringify({ aaa: null })).toBe('aaa=null');
  expect(jsonSearchParamsSerializer.stringify({ aaa: undefined })).toBe('');
  expect(jsonSearchParamsSerializer.stringify({ aaa: { toJSON: () => null } })).toBe('aaa=null');
  expect(jsonSearchParamsSerializer.stringify({ aaa: { toJSON: () => true } })).toBe('aaa=true');
  expect(jsonSearchParamsSerializer.stringify({ aaa: { toJSON: () => 'true' } })).toBe('aaa=%22true%22');
  expect(jsonSearchParamsSerializer.stringify({ aaa: new String('null') })).toBe('aaa=%22null%22');
});

// prettier-ignore
test('parses search params', () => {
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({}))).toStrictEqual({});
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: 111 }))).toStrictEqual({ aaa: 111 });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: NaN }))).toStrictEqual({ aaa: null });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: Infinity }))).toStrictEqual({ aaa: null });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: 'xxx' }))).toStrictEqual({ aaa: 'xxx' });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: 'true' }))).toStrictEqual({ aaa: 'true' });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: true }))).toStrictEqual({ aaa: true });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: [] }))).toStrictEqual({ aaa: [] });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: [111, 222] }))).toStrictEqual({ aaa: [111, 222] });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: { bbb: 111 } }))).toStrictEqual({ aaa: { bbb: 111 } });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: null }))).toStrictEqual({ aaa: null });
  expect(jsonSearchParamsSerializer.parse(jsonSearchParamsSerializer.stringify({ aaa: undefined }))).toStrictEqual({});
});

test('only the first param value is used during parsing', () => {
  expect(jsonSearchParamsSerializer.parse('aaa=true&aaa=false')).toStrictEqual({ aaa: true });
});
