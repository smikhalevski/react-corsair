import { PubSub } from 'parallel-universe';
import type { Route, RouterEvent } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';
import { isPromiseLike, noop } from './utils';

export class Router<Result> {
  baseURL: string;
  routes: readonly Route<Result, any>[];
  route: Route<Result, any> | null = null;
  params: any = undefined;
  result: Result | undefined = undefined;

  private _pubSub = new PubSub<RouterEvent>();
  private _promise: Promise<unknown> | null = null;

  get isPending(): boolean {
    return this._promise !== null;
  }

  constructor(
    baseURL: string,
    routes?: Route<Result, any>[],
    private _searchParamsParser = urlSearchParamsParser
  ) {
    baseURL = new URL(baseURL).toString();

    const index = Math.min(baseURL.indexOf('?'), baseURL.indexOf('#'));

    this.baseURL = index !== -1 ? baseURL.substring(0, index) : baseURL;
    this.routes = routes !== undefined ? routes.slice(0) : [];
  }

  getURL<Params>(route: Route<any, Params>, params: Params, fragment?: string): string {
    return route.urlComposer(this.baseURL, params, fragment, this._searchParamsParser);
  }

  toPromise(): Promise<void> {
    return this._promise !== null ? this._promise.then(noop) : Promise.resolve();
  }

  subscribe(listener: (event: RouterEvent) => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  protected navigate(url: URL | string): void {
    url = new URL(url);

    let promise: Promise<any[] | undefined> | undefined;
    let routeMatch: any[] | undefined;

    for (const route of this.routes) {
      const pathnameParams = route.pathnameParamsParser(url.pathname);

      if (!pathnameParams) {
        // Non-matching pathname
        continue;
      }

      let params = undefined;

      if (route.paramsValidator !== undefined) {
        const searchParams = (route.searchParamsParser || this._searchParamsParser).parse(url.search);

        params = route.paramsValidator(Object.assign({}, searchParams, pathnameParams));

        if (params === undefined) {
          // Invalid params
          continue;
        }
      }

      const result = route.resolver(params);

      if (result === undefined) {
        // Not resolvable
        continue;
      }

      if (promise !== undefined || isPromiseLike(result)) {
        const routeMatch = Promise.resolve(result).then(result =>
          result !== undefined ? [route, result, params] : undefined
        );

        if (promise !== undefined) {
          promise = promise.then(prevRouteMatch => (prevRouteMatch !== undefined ? prevRouteMatch : routeMatch));
        } else {
          promise = routeMatch;
        }
        continue;
      }

      routeMatch = [route, result, params];
      break;
    }

    if (promise === undefined) {
      this._promise = null;
      this._resolveNavigate(routeMatch);
      return;
    }

    this._promise = promise.then(routeMatch => {
      if (this._promise === promise) {
        this._resolveNavigate(routeMatch);
      }
    });
    this._pubSub.publish({ type: 'pending', target: this });
  }

  private _resolveNavigate(routeMatch: any[] | undefined): void {
    if (routeMatch !== undefined) {
      this.route = routeMatch[0];
      this.params = routeMatch[1];
      this.result = routeMatch[2];
      this._pubSub.publish({ type: 'navigated', target: this });
      return;
    }

    this.route = null;
    this.params = undefined;
    this.result = undefined;
    this._pubSub.publish({ type: 'notFound', target: this });
  }
}
