import { expectTypeOf, test } from 'vitest';
import { createRoute } from '../main/index.js';

test('', () => {
  expectTypeOf(createRoute()['$inferParams']).toEqualTypeOf<{}>();

  expectTypeOf(
    createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } })['$inferParams']
  ).toEqualTypeOf<{ aaa: number }>();

  expectTypeOf(
    createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } })['$inferParams']
  ).toEqualTypeOf<{ aaa?: number }>();

  expectTypeOf(
    createRoute(createRoute(), { pathname: '', paramsAdapter: null as unknown as () => { aaa: number } })[
      '$inferParams'
    ]
  ).toEqualTypeOf<{ aaa: number }>();

  expectTypeOf(
    createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } }), {
      pathname: '',
      paramsAdapter: null as unknown as () => { bbb: string },
    })['$inferParams']
  ).toEqualTypeOf<{ aaa: number; bbb: string }>();

  expectTypeOf(
    createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } }), {
      pathname: '',
      paramsAdapter: null as unknown as () => { bbb: string },
    })['$inferParams']
  ).toEqualTypeOf<{ aaa?: number; bbb: string }>();

  expectTypeOf(
    createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } }), {
      pathname: '',
      paramsAdapter: null as unknown as () => { bbb?: string },
    })['$inferParams']
  ).toEqualTypeOf<{ aaa: number; bbb?: string }>();

  expectTypeOf(
    createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } }), {
      pathname: '',
      paramsAdapter: null as unknown as () => { bbb?: string },
    })['$inferParams']
  ).toEqualTypeOf<{ aaa?: number; bbb?: string }>();
});
