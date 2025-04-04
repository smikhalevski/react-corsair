import { createRoute, useRoute } from '../main';
import { expectType } from 'tsd';

expectType<any>(useRoute().params);

expectType<any>(useRoute().getData());

expectType<{}>(useRoute(createRoute('/aaa')).params);

expectType<void>(useRoute(createRoute('/aaa')).getData());

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
  ).getData()
);
