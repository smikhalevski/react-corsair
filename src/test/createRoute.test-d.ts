import { expectType } from 'tsd';
import { createRoute } from '../main';
import { type PARAMS } from '../main/Route';

declare const PARAMS: PARAMS;

expectType<{}>(createRoute()[PARAMS]);

expectType<{ aaa: number }>(
  createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } })[PARAMS]
);

expectType<{ aaa?: number }>(
  createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } })[PARAMS]
);

expectType<{ aaa: number }>(
  createRoute(createRoute(), { pathname: '', paramsAdapter: null as unknown as () => { aaa: number } })[PARAMS]
);

expectType<{ aaa: number; bbb: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb: string },
  })[PARAMS]
);

expectType<{ aaa?: number; bbb: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb: string },
  })[PARAMS]
);

expectType<{ aaa: number; bbb?: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb?: string },
  })[PARAMS]
);

expectType<{ aaa?: number; bbb?: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb?: string },
  })[PARAMS]
);
