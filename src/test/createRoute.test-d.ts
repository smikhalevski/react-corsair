import { expectType } from 'tsd';
import { createRoute, Dict } from '../main';
import { LOCATION_PARAMS } from '../main/Route';

expectType<Dict | void>(createRoute()[LOCATION_PARAMS]);

expectType<{ aaa: number }>(
  createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } })[LOCATION_PARAMS]
);

expectType<{ aaa?: number } | void>(
  createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } })[LOCATION_PARAMS]
);

expectType<{ [key: string]: any; aaa: number }>(
  createRoute(createRoute(), { pathname: '', paramsAdapter: null as unknown as () => { aaa: number } })[LOCATION_PARAMS]
);

expectType<{ aaa: number; bbb: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb: string },
  })[LOCATION_PARAMS]
);

expectType<{ aaa?: number; bbb: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb: string },
  })[LOCATION_PARAMS]
);

expectType<{ aaa: number; bbb?: string }>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb?: string },
  })[LOCATION_PARAMS]
);

expectType<{ aaa?: number; bbb?: string } | void>(
  createRoute(createRoute({ pathname: '', paramsAdapter: null as unknown as () => { aaa?: number } }), {
    pathname: '',
    paramsAdapter: null as unknown as () => { bbb?: string },
  })[LOCATION_PARAMS]
);
