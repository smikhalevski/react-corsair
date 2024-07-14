import { Route } from './Route';

export interface RouteSnapshot<Params, Data> {
  isLoading: boolean;
  params: Params;
  data: Data;
}

export interface RouterSnapshot {
  isLoading: boolean;

  get<Params extends object | void, Data>(route: Route<any, Params, Data>): RouteSnapshot<Params, Data>;
}
