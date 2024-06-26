import { createElement, memo, ReactElement } from 'react';
import { URLPattern } from 'urlpattern-polyfill';
import { ComponentLoader, ParamsParser, PathnameMatcher, RawParams, RouteMatch, URLComposer } from './types';
import { isPromiseLike, noop } from './utils';

/**
 * Options of the {@link Route} constructor.
 *
 * @template Params The parsed and validated URL params.
 */
export interface RouteOptions<Params> {
  /**
   * The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   */
  pathname: string | PathnameMatcher;

  /**
   * Loads the component rendered by the route. If the loader successfully returns the component, the latter is cached.
   * If the loader throws an error, then it would be called again when the route is rendered next time.
   */
  loader: ComponentLoader;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  paramsParser?: ParamsParser<Params> | ParamsParser<Params>['parse'];

  /**
   * Composes a URL with the given params and the hash.
   */
  urlComposer?: URLComposer<Params>;

  /**
   * If `true` then pathname leading and trailing slashes must strictly match the pathname pattern.
   *
   * **Note:** Applicable only if {@link pathname} is a string.
   *
   * @default false
   */
  slashSensitive?: boolean;

  /**
   * Called before the route component is rendered and when {@link Route.prefetch} is called. If promise is returned,
   * the component rendering is delayed until the promise is resolved.
   *
   * @param params The parsed and validated URL params.
   */
  onBeforeRender?: (params: Params) => PromiseLike<void> | void;
}

export class Route<Params = object | void> {
  /**
   * Extracts raw params from the URL pathname.
   */
  protected _pathnameMatcher: PathnameMatcher;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  protected _paramsParser: ParamsParser<Params> | undefined;

  /**
   * Composes a URL with the given params and the hash.
   */
  protected _urlComposer: URLComposer<Params>;

  /**
   * Loads the component, awaits {@link RouteOptions.onBeforeRender}, and the resolves with the element that must be
   * rendered. If there's nothing to await, an element is returned synchronously.
   *
   * @param params The parsed and validated URL params.
   */
  protected _render: (params: Params) => Promise<ReactElement> | ReactElement;

  /**
   * Creates a route that maps pathname and params to a component.
   *
   * @param pathname The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   * @param loader Loads the component rendered by the route.
   */
  constructor(pathname: string | PathnameMatcher, loader: ComponentLoader);

  /**
   * Creates a route that maps pathname and params to a component.
   *
   * @param options Route options.
   */
  constructor(options: RouteOptions<Params>);

  constructor(options: string | PathnameMatcher | RouteOptions<any>, loader?: ComponentLoader) {
    options = typeof options === 'object' ? options : { pathname: options, loader: loader! };

    const { pathname, urlComposer, paramsParser, onBeforeRender } = options;

    if (typeof pathname === 'string') {
      this._urlComposer = urlComposer || createURLComposer(pathname);
      this._pathnameMatcher = createPathnameMatcher(pathname, options.slashSensitive);
    } else {
      if (urlComposer === undefined) {
        throw new Error('Cannot infer urlComposer from the pathname. The urlComposer option is required.');
      }
      this._urlComposer = urlComposer;
      this._pathnameMatcher = pathname;
    }

    this._paramsParser = typeof paramsParser === 'function' ? { parse: paramsParser } : paramsParser;

    const cachedRenderer = createCachedRenderer(options.loader);

    this._render = params => {
      const element = cachedRenderer();
      const promise = onBeforeRender?.(params);

      return isPromiseLike(promise) ? Promise.all([element, promise]).then(pair => pair[0]) : element;
    };
  }

  /**
   * Prefetches the route component and calls {@link RouteOptions.onBeforeRender}.
   *
   * @param params The params for which the data must be prefetched.
   * @returns The promise that is resolved when prefetch is completed, or `undefined` if route is ready to be rendered.
   */
  prefetch(params: Params): Promise<void> | undefined {
    const element = this._render(params);

    if (isPromiseLike(element)) {
      return element.then(noop);
    }
  }
}

/**
 * Creates a function that renders the route element or throws a promise if route isn't loaded yet.
 *
 * @param route The route ro render.
 * @param params The parsed and validated URL params that the renderer would use.
 */
export function createSuspenseRenderer<Params>(route: Route<Params>, params: Params): () => ReactElement {
  let element: Promise<ReactElement> | ReactElement | undefined;

  return () => {
    if (element === undefined) {
      element = route['_render'](params);

      if (isPromiseLike(element)) {
        // Suspend rendering until the component is loaded
        throw (element = element.then(e => (element = e)));
      }
    }
    if (isPromiseLike(element)) {
      throw element;
    }
    return element;
  };
}

/**
 * Create a function that loads the component and returns an element to render. The component is loaded only once, if an
 * error occurs during loading, then loading is retried the next time the returned renderer is called.
 *
 * @param loader Loads the component rendered by the route.
 */
function createCachedRenderer(loader: ComponentLoader): () => Promise<ReactElement> | ReactElement {
  let element: Promise<ReactElement> | ReactElement | undefined;

  return () => {
    if (element !== undefined) {
      return element;
    }

    const component = loader();

    if (!isPromiseLike(component)) {
      element = createElement(memo(component, propsAreEqual));
      return element;
    }

    element = Promise.resolve(component).then(
      module => {
        element = createElement(memo(module.default, propsAreEqual));
        return element;
      },
      error => {
        element = undefined;
        throw error;
      }
    );
    return element;
  };
}

function propsAreEqual(_prevProps: unknown, _nextProps: unknown): boolean {
  // Route components don't receive any props, so props are always equal
  return true;
}

/**
 * Infers pathname matcher from URL pattern.
 *
 * @param pattern The pathname pattern with {@link !URLPattern} syntax that the created composer would use to build URLs
 * upon.
 * @param isSlashSensitive If `true` then pathname leading and trailing slashes must strictly match the pattern.
 */
export function createPathnameMatcher(pattern: string, isSlashSensitive = false): PathnameMatcher {
  const urlPattern = new URLPattern({ pathname: pattern });
  const hasNestedPathname = pattern === '*' || pattern.endsWith('/*');

  const a = pattern[0] === '/';
  const b = pattern[pattern.length - 1] === '/';

  return pathname => {
    if (!isSlashSensitive) {
      if (a !== (pathname.length !== 0 && pathname[0] === '/')) {
        pathname = a ? '/' + pathname : pathname.substring(1);
      }

      if (b !== (pathname.length !== 0 && pathname[pathname.length - 1] === '/')) {
        pathname = b ? pathname + '/' : pathname.slice(0, -1);
      }
    }

    const match = urlPattern.exec({ pathname });

    if (match === null) {
      return null;
    }

    const params = match.pathname.groups;

    let nestedPathname;

    if (hasNestedPathname) {
      for (let i = 0; params[i] !== undefined; ++i) {
        nestedPathname = params[i];
      }
      pathname = pathname.substring(0, pathname.length - nestedPathname!.length - 1);
    }

    return { pathname, params, nestedPathname };
  };
}

/**
 * Creates a composer that builds a URL by injecting params into a pathname pattern, and serializing the rest of params
 * as a search string.
 *
 * @param pattern The pathname pattern with {@link !URLPattern} syntax that the created composer would use to build URLs
 * upon.
 */
export function createURLComposer(pattern: string): URLComposer<any> {
  if (!/^[^*{(]*\**$/.test(pattern)) {
    throw new Error(
      'Cannot infer urlComposer from a pathname that contains non-capturing groups, RegExp groups, or non-trailing wildcards. The urlComposer option is required.'
    );
  }

  pattern = pattern.replace(/\/?\*+$/, '');

  return (base, params, hash, searchParamsParser) => {
    let pathname = pattern;
    let search = '';

    if (params !== undefined) {
      const searchParams: RawParams = {};

      for (const name of Object.keys(params).sort(compareLengthDescending)) {
        const value = params[name];

        if (value === null || value === undefined) {
          continue;
        }
        if (pathname === (pathname = pathname.replace(':' + name, encodeURIComponent(value)))) {
          searchParams[name] = value;
        }
      }

      if (pathname.indexOf(':') !== -1) {
        throw new Error('Pathname params are missing: ' + /:[\w$]+/g.exec(pathname));
      }

      search = searchParamsParser.stringify(searchParams);
    }

    if (base === undefined) {
      base = '';
    } else if (pathname.length !== 0 && base.length !== 0 && pathname[0] !== '/' && base[base.length - 1] !== '/') {
      base += '/';
    }

    search = search.length === 0 || search === '?' ? '' : search[0] === '?' ? search : '?' + search;

    hash =
      hash === undefined || hash.length === 0 || hash === '#'
        ? ''
        : hash[0] === '#'
          ? hash
          : '#' + encodeURIComponent(hash);

    return base + pathname + search + hash;
  };
}

function compareLengthDescending(a: string, b: string): number {
  return b.length - a.length;
}

/**
 * Matches a URL with a route.
 *
 * @param pathname The pathname to match.
 * @param searchParams The search params to match.
 * @param routes The array of routes to which the router can navigate.
 */
export function matchRoute(pathname: string, searchParams: RawParams, routes: Route<any>[]): RouteMatch | null {
  for (const route of routes) {
    const match = route['_pathnameMatcher'](pathname);

    if (match === null) {
      continue;
    }

    try {
      return {
        route,
        pathname: match.pathname,
        params: route['_paramsParser']?.parse({ ...searchParams, ...match.params }),
        nestedPathname: match.nestedPathname,
      };
    } catch {}
  }
  return null;
}
