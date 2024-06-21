import type { Route, SearchParamsParser } from './types';
import { urlSearchParamsParser } from './urlSearchParamsParser';

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

  // getURL(route: Route<Result, any>, fragment?: string): string | undefined;
  //
  // getURL<Params>(route: Route<Result, Params>, params: Params, fragment?: string): string | undefined;
  //
  // getURL(route: Route<Result, any>, params: unknown, fragment?: string): string | undefined {
  //   if (typeof params === 'string') {
  //     fragment = params;
  //     params = undefined;
  //   }
  //   if (this.routes.includes(route)) {
  //     return route.urlComposer(this.base, params, fragment, this.searchParamsParser);
  //   }
  // }
  //
  // goTo(route: Route<Result, void>, fragment?: string): boolean;
  //
  // goTo<Params>(route: Route<Result, Params>, params: NoInfer<Params>, fragment?: string): boolean;
  //
  // goTo(route: Route<Result, any>, params?: unknown, fragment?: string): boolean {
  //   const url = this.getURL(route, params, fragment);
  //
  //   if (url === undefined) {
  //     return false;
  //   }
  //   this.navigate(url);
  //   return true;
  // }
}
