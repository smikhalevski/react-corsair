import { Route } from './Route';

export function useRouteParams<Params extends object | void>(route: Route<any, Params>): Params {
  return undefined!;
}

export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  return undefined!;
}

export function useRouteError(): any {
  return undefined!;
}
