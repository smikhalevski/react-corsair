import { jsonSearchParamsSerializer as serializer } from '../../main/history';

test('stringifies search params', () => {
  expect(serializer.stringify({})).toBe('');
  expect(serializer.stringify({ aaa: 111 })).toBe('aaa=111');
  expect(serializer.stringify({ aaa: NaN })).toBe('aaa=null');
  expect(serializer.stringify({ aaa: Infinity })).toBe('aaa=null');
  expect(serializer.stringify({ aaa: 'xxx' })).toBe('aaa=xxx');
  expect(serializer.stringify({ aaa: 'xxx yyy' })).toBe('aaa=xxx+yyy');
  expect(serializer.stringify({ aaa: 'true' })).toBe('aaa=%22true%22');
  expect(serializer.stringify({ aaa: true })).toBe('aaa=true');
  expect(serializer.stringify({ aaa: [] })).toBe('aaa=%5B%5D');
  expect(serializer.stringify({ aaa: [111, 222] })).toBe('aaa=%5B111%2C222%5D');
  expect(serializer.stringify({ aaa: { bbb: 111 } })).toBe('aaa=%7B%22bbb%22%3A111%7D');
  expect(serializer.stringify({ aaa: 'null' })).toBe('aaa=%22null%22');
  expect(serializer.stringify({ aaa: null })).toBe('aaa=null');
  expect(serializer.stringify({ aaa: undefined })).toBe('');
  expect(serializer.stringify({ aaa: { toJSON: () => null } })).toBe('aaa=null');
  expect(serializer.stringify({ aaa: { toJSON: () => true } })).toBe('aaa=true');
  expect(serializer.stringify({ aaa: { toJSON: () => 'true' } })).toBe('aaa=%22true%22');
  expect(serializer.stringify({ aaa: new String('null') })).toBe('aaa=%22null%22');
});

test('parses search params', () => {
  expect(serializer.parse(serializer.stringify({}))).toStrictEqual({});
  expect(serializer.parse(serializer.stringify({ aaa: 111 }))).toStrictEqual({ aaa: 111 });
  expect(serializer.parse(serializer.stringify({ aaa: NaN }))).toStrictEqual({ aaa: null });
  expect(serializer.parse(serializer.stringify({ aaa: Infinity }))).toStrictEqual({ aaa: null });
  expect(serializer.parse(serializer.stringify({ aaa: 'xxx' }))).toStrictEqual({ aaa: 'xxx' });
  expect(serializer.parse(serializer.stringify({ aaa: 'true' }))).toStrictEqual({ aaa: 'true' });
  expect(serializer.parse(serializer.stringify({ aaa: true }))).toStrictEqual({ aaa: true });
  expect(serializer.parse(serializer.stringify({ aaa: [] }))).toStrictEqual({ aaa: [] });
  expect(serializer.parse(serializer.stringify({ aaa: [111, 222] }))).toStrictEqual({ aaa: [111, 222] });
  expect(serializer.parse(serializer.stringify({ aaa: { bbb: 111 } }))).toStrictEqual({ aaa: { bbb: 111 } });
  expect(serializer.parse(serializer.stringify({ aaa: null }))).toStrictEqual({ aaa: null });
  expect(serializer.parse(serializer.stringify({ aaa: undefined }))).toStrictEqual({});
});

test('only the first param value is used during parsing', () => {
  expect(serializer.parse('aaa=true&aaa=false')).toStrictEqual({ aaa: true });
});
