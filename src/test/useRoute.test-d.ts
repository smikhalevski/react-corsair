import { createRoute, useRoute } from '../main/index.js';
import { expectType } from 'tsd';

expectType<any>(useRoute().params);

expectType<any>(useRoute().data);

expectType<{}>(useRoute(createRoute('/aaa')).params);

expectType<void>(useRoute(createRoute('/aaa')).data);

expectType<{ xxx: 111 }>(
  useRoute(
    createRoute({
      pathname: '/aaa',
      paramsAdapter: (): { xxx: 111 } => null as never,
    })
  ).params
);

expectType<{ xxx: 111 }>(
  useRoute(
    createRoute({
      pathname: '/aaa',
      dataLoader: (): { xxx: 111 } => null as never,
    })
  ).data
);
