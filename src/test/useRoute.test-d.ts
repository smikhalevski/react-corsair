import { expectTypeOf, test } from 'vitest';
import { createRoute, useRoute } from '../main/index.js';

test('', () => {
  expectTypeOf(useRoute().params).toEqualTypeOf<any>();

  expectTypeOf(useRoute().data).toEqualTypeOf<any>();

  expectTypeOf(useRoute(createRoute('/aaa')).params).toEqualTypeOf<{}>();

  expectTypeOf(useRoute(createRoute('/aaa')).data).toEqualTypeOf<void>();

  expectTypeOf(
    useRoute(
      createRoute({
        pathname: '/aaa',
        paramsAdapter: (): { xxx: 111 } => null as never,
      })
    ).params
  ).toEqualTypeOf<{ xxx: 111 }>();

  expectTypeOf(
    useRoute(
      createRoute({
        pathname: '/aaa',
        dataLoader: (): { xxx: 111 } => null as never,
      })
    ).data
  ).toEqualTypeOf<{ xxx: 111 }>();
});
