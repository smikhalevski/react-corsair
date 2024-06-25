import { createElement, memo, ReactElement } from 'react';
import { inferPathnameMatcher } from './inferPathnameMatcher';
import { inferURLComposer } from './inferURLComposer';
import { ComponentFetcher, ParamsParser, PathnameMatcher, URLComposer } from './types';
import { isPromiseLike, noop } from './utils';

/**
 * Options of a route.
 *
 * @template Params The parsed and validated URL params.
 */
export interface RouteOptions<Params> {
  /**
   * The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   */
  pathname: string | PathnameMatcher;

  /**
   * Fetches the component rendered by the route.
   */
  componentFetcher: ComponentFetcher;

  /**
   * Fetches the data required during the route rendering. This function is called every time the route is navigated to.
   * If a promise is returned, it is awaited before route is rendered.
   *
   * @param params The parsed and validated URL params.
   */
  dataFetcher?: (params: Params) => PromiseLike<void> | void;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  paramsParser?: ParamsParser<Params> | ParamsParser<Params>['parse'];

  /**
   * Composes a URL with the given params and the fragment.
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
}

export class Route<Params = object | void> {
  /**
   * Extracts raw params from the URL pathname.
   */
  protected _pathnameMatcher: PathnameMatcher;

  /**
   * Fetches the component and data and resolves with the element that must be rendered.
   */
  protected _renderer: (params: Params) => Promise<ReactElement> | ReactElement;

  /**
   * Parses params that were extracted from the URL pathname and search string.
   */
  protected _paramsParser: ParamsParser<Params> | undefined;

  /**
   * Composes a URL with the given params and the fragment.
   */
  protected _urlComposer: URLComposer<Params>;

  /**
   * Creates a route that maps pathname and params to a component.
   *
   * @param pathname The route pathname pattern that uses {@link !URLPattern} syntax, or a callback that parses a pathname.
   * @param componentFetcher Loads the component rendered by the route.
   */
  constructor(pathname: string | PathnameMatcher, componentFetcher: ComponentFetcher);

  /**
   * Creates a route that maps pathname and params to a component.
   *
   * @param options Route options.
   */
  constructor(options: RouteOptions<Params>);

  constructor(options: string | PathnameMatcher | RouteOptions<any>, componentFetcher?: ComponentFetcher) {
    options = typeof options === 'object' ? options : { pathname: options, componentFetcher: componentFetcher! };

    const { pathname, urlComposer, paramsParser, dataFetcher } = options;

    if (typeof pathname === 'string') {
      this._pathnameMatcher = inferPathnameMatcher(pathname, options.slashSensitive);
      this._urlComposer = urlComposer || inferURLComposer(pathname);
    } else {
      this._pathnameMatcher = pathname;

      if (urlComposer === undefined) {
        throw new Error('Cannot infer urlComposer from the pathname parser. The urlComposer option is required.');
      }
      this._urlComposer = urlComposer;
    }

    this._paramsParser = typeof paramsParser === 'function' ? { parse: paramsParser } : paramsParser;

    const renderComponent = createComponentRenderer(options.componentFetcher);

    this._renderer = params => {
      const element = renderComponent();
      const promise = dataFetcher?.(params);

      if (promise === undefined) {
        return element;
      }
      if (isPromiseLike(element)) {
        return Promise.all([element, promise]).then(([element]) => element);
      }
      return element;
    };
  }

  /**
   * Prefetches the route component and data.
   *
   * @param params The params for which the data must be prefetched.
   */
  prefetch(params: Params): void {
    const element = this._renderer(params);

    if (isPromiseLike(element)) {
      element.catch(noop);
    }
  }
}

function createComponentRenderer(componentFetcher: ComponentFetcher): () => Promise<ReactElement> | ReactElement {
  let element: Promise<ReactElement> | ReactElement | undefined;

  return () => {
    if (element !== undefined) {
      return element;
    }

    const component = componentFetcher();

    if (!isPromiseLike(component)) {
      element = createElement(memo(component));
      return element;
    }

    element = Promise.resolve(component).then(
      module => {
        element = createElement(memo(module.default));
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
