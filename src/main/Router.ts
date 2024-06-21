import { PubSub } from 'parallel-universe';
import type { RawParams, Route, SearchParamsParser } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';
import { isPromiseLike, noop } from './utils';

/**
 * Options of a router.
 *
 * @template Result The result returned by {@link RouteOptions.resolver route resolvers}.
 */
export interface RouterOptions<Result> {
  /**
   * The absolute URL, pathname, or `window.location`.
   */
  base?: string | URL | Location;

  /**
   * The array of routes to which the router can navigate.
   */
  routes?: Route<Result, any>[];

  /**
   * Extracts raw params from a URL search string and stringifies them back.
   *
   * By default, {@link !URLSearchParams} is used to parse and stringify the search string.
   */
  searchParamsParser?: SearchParamsParser;
}

interface RouteMatch<Result> {
  route: Route<Result, any>;
  params: RawParams;
  result: Result;
}

export class Router<Result> {
  /**
   * The origin of the absolute URL.
   *
   * @example http://example.com
   */
  origin: string | undefined;

  /**
   * The base pathname, always starts with "/".
   */
  pathname: string;

  /**
   * The search params parser that extracts raw params from a URL search string and stringifies them back. It is used
   * if a route doesn't define {@link RouteOptions.searchParamsParser its own params parser}.
   */
  searchParamsParser: SearchParamsParser;

  /**
   * The array of routes to which the router can navigate.
   */
  routes: Route<Result, any>[];

  /**
   * Creates a new {@link Router} instance.
   *
   * @param options Router options.
   */
  constructor(options: RouterOptions<Result> = {}) {
    const { routes = [], searchParamsParser = urlSearchParamsParser } = options;

    const base = options.base === undefined ? '' : options.base.toString();

    try {
      const url = new URL(base);
      this.origin = url.origin;
      this.pathname = url.pathname;
    } catch {
      const url = new URL(base, 'https://undefined');
      this.origin = undefined;
      this.pathname = base[0] === '/' ? url.pathname : '/' + url.pathname;
    }

    this.searchParamsParser = searchParamsParser;
    this.routes = routes;
  }

  getURL(route: Route<Result, any>, fragment?: string): string | undefined;

  getURL<Params>(route: Route<Result, Params>, params: Params, fragment?: string): string | undefined;

  getURL(route: Route<Result, any>, params: unknown, fragment?: string): string | undefined {
    if (typeof params === 'string') {
      fragment = params;
      params = undefined;
    }
    if (this.routes.includes(route)) {
      return route.urlComposer(this.base, params, fragment, this.searchParamsParser);
    }
  }

  goTo(route: Route<Result, void>, fragment?: string): boolean;

  goTo<Params>(route: Route<Result, Params>, params: NoInfer<Params>, fragment?: string): boolean;

  goTo(route: Route<Result, any>, params?: unknown, fragment?: string): boolean {
    const url = this.getURL(route, params, fragment);

    if (url === undefined) {
      return false;
    }
    this.navigate(url);
    return true;
  }

  private _pubSub = new PubSub();
  private _promise: Promise<unknown> | null = null;

  get isPending(): boolean {
    return this._promise !== null;
  }

  toPromise(): Promise<void> {
    return this._promise !== null ? this._promise.then(noop) : Promise.resolve();
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  protected navigate(url: URL | string): void {
    url = new URL(url);

    let promise: Promise<any[] | undefined> | undefined;
    let routeMatch: any[] | undefined;

    for (const route of this.routes) {
      const pathnameParams = route.pathnameMatcher(url.pathname);

      if (!pathnameParams) {
        // Non-matching pathname
        continue;
      }

      let params = undefined;

      if (route.paramsValidator !== undefined) {
        const searchParams = (route.searchParamsParser || this.searchParamsParser).parse(url.search);

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

    const resolve = (routeMatch: any[] | undefined) => {
      if (routeMatch !== undefined) {
        this.route = routeMatch[0];
        this.params = routeMatch[1];
        this.result = routeMatch[2];
        this._pubSub.publish();
        return;
      }

      this.route = null;
      this.params = undefined;
      this.result = undefined;
      this._pubSub.publish();
    };

    if (promise === undefined) {
      this._promise = null;
      resolve(routeMatch);
      return;
    }

    this._promise = promise.then(routeMatch => {
      if (this._promise === promise) {
        resolve(routeMatch);
      }
    });
    this._pubSub.publish();
  }
}

// export class HistoryRouter<Result> extends Router<Result> {}
//
// // if last * or {} group captures the tail of the URL pathname, it is passed to the nested router
// export class NestedRouter<Result> extends Router<Result> {
//   constructor(parentRouter: Router<Result>, delegateRouter) {
//     super();
//   }
// }

// const aaaRoute = createRoute('/aaa', 111);
// const bbbRoute = createRoute<number, { xxx: string }>('/bbb/:xxx', 222);
//
// const router = new Router('xxx', [aaaRoute, bbbRoute]);
//
// router.goTo(aaaRoute);
// router.goTo(bbbRoute, { xxx: 'yyy', zzz: '' });
