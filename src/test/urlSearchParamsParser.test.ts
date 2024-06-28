import { urlSearchParamsParser } from '../main/ParameterizedLocationMatcher';

describe('urlSearchParamsParser', () => {
  test('parses params', () => {
    expect(urlSearchParamsParser.parse('aaa=bbb')).toStrictEqual({ aaa: 'bbb' });
    expect(urlSearchParamsParser.parse('aaa=bbb&aaa=ccc')).toStrictEqual({ aaa: ['bbb', 'ccc'] });
    expect(urlSearchParamsParser.parse('aaa=bbb%2C111&aaa=ccc%2C222')).toStrictEqual({ aaa: ['bbb,111', 'ccc,222'] });
  });

  test('stringifies params', () => {
    expect(urlSearchParamsParser.stringify({ aaa: 'bbb' })).toBe('aaa=bbb');
    expect(urlSearchParamsParser.stringify({ aaa: ['bbb', 'ccc'] })).toBe('aaa=bbb&aaa=ccc');
    expect(urlSearchParamsParser.stringify({ aaa: new Set(['bbb', 'ccc']) })).toBe('aaa=bbb&aaa=ccc');
    expect(
      urlSearchParamsParser.stringify({
        aaa: new Map([
          ['bbb', 111],
          ['ccc', 222],
        ]),
      })
    ).toBe('aaa=bbb%2C111&aaa=ccc%2C222');
  });
});
