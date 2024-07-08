import { ReactNode } from 'react';
import { memoizeNode } from './utils';
import { Outlet } from './Outlet';
import { PathnameAdapter } from './PathnameAdapter';
import { Dict, Location, LocationOptions, RouteContent, RouteOptions } from './types';

type Squash<T> = { [K in keyof T]: T[K] } & {};

/**
 * A route that can be rendered by a router.
 *
 * @template Parent A parent route or `null` if there is no parent.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.dataLoader}.
 */
export class Route<
  Parent extends Route<any, any, Context> | null = any,
  Params extends object | void = any,
  Data = any,
  Context = any,
> {
  /**
   * The type of cumulative route params.
   *
   * @internal
   */
  declare _params: Parent extends Route ? Squash<Parent['_params'] & Params> : Params;

  /**
   * The type of route context.
   *
   * @internal
   */
  declare _context: Context;

  /**
   * A parent route or `null` if there is no parent.
   */
  readonly parent: Parent;

  protected _pathnameAdapter;
  protected _paramsAdapter;
  protected _pendingNode;
  protected _errorNode;
  protected _notFoundNode;
  protected _pendingBehavior;
  protected _contentRenderer;
  protected _dataLoader;

  /**
   * Creates a new instance of a {@link Route}.
   *
   * @param parent A parent route or `null` if there is no parent.
   * @param options Route options.
   * @template Parent A parent route or `null` if there is no parent.
   * @template Params Route params.
   * @template Data Data loaded by a route.
   * @template Context A context provided by a {@link Router} for a {@link RouteOptions.dataLoader}.
   */
  constructor(parent: Parent, options: RouteOptions<Params, Data, Context>) {
    const { paramsAdapter } = options;

    this.parent = parent;

    this._pathnameAdapter = new PathnameAdapter(options.pathname);
    this._paramsAdapter = typeof paramsAdapter === 'function' ? { parse: paramsAdapter } : paramsAdapter;
    this._pendingNode = memoizeNode(options.pendingFallback);
    this._errorNode = memoizeNode(options.errorFallback);
    this._notFoundNode = memoizeNode(options.notFoundFallback);
    this._pendingBehavior = options.pendingBehavior;
    this._contentRenderer = createContentRenderer(options.content);
    this._dataLoader = options.dataLoader;
  }

  /**
   * Returns a route location.
   *
   * @param params Route params.
   * @param options Location options.
   */
  getLocation(params: this['_params'], options?: LocationOptions): Location {
    const { parent, _pathnameAdapter, _paramsAdapter } = this;

    let pathname;
    let searchParams: Dict = {};

    if (params === undefined) {
      // No params = no search params
      searchParams = {};
      pathname = _pathnameAdapter.toPathname(undefined);
    } else {
      if (_paramsAdapter === undefined || _paramsAdapter.toSearchParams === undefined) {
        // Search params = params omit pathname params
        for (const paramName in params) {
          if (params.hasOwnProperty(paramName) && !_pathnameAdapter.paramNames.has(paramName)) {
            searchParams[paramName] = params[paramName];
          }
        }
      } else {
        searchParams = _paramsAdapter.toSearchParams(params);
      }

      pathname = _pathnameAdapter.toPathname(
        _paramsAdapter === undefined || _paramsAdapter.toPathnameParams === undefined ? params : undefined
      );
    }

    if (parent !== null) {
      const location = parent.getLocation(params, options);

      location.pathname += location.pathname.endsWith('/') ? pathname : '/' + pathname;

      // Merge search params
      Object.assign(location.searchParams, searchParams);

      return location;
    }

    let hash;

    hash =
      options === undefined || (hash = options.hash) === undefined || hash === '' || hash === '#'
        ? ''
        : hash.charAt(0) === '#'
          ? hash
          : '#' + encodeURIComponent(hash);

    return {
      pathname: '/' + pathname,
      searchParams,
      hash,
      state: options?.state,
    };
  }

  /**
   * Prefetches route content and data of this route and its ancestors.
   *
   * @param params Route params.
   * @param context A context provided to a {@link RouteOptions.dataLoader}.
   */
  prefetch(params: this['_params'], context: Context): void {
    for (let route: Route | null = this; route !== null; route = route.parent) {
      try {
        route['_contentRenderer']();
        route['_dataLoader']?.(params, context);
      } catch {
        // noop
      }
    }
  }
}

/**
 * Create a function that loads the component and returns a node to render. The component is loaded only once,
 * if an error occurs during loading, then loading is retried the next time the returned render is called.
 */
function createContentRenderer(content: RouteContent): () => Promise<ReactNode> | ReactNode {
  let node: Promise<ReactNode> | ReactNode | undefined;

  if (content === undefined) {
    node = memoizeNode(Outlet);
  }

  return () => {
    if (node !== undefined) {
      return node;
    }

    if (typeof content !== 'function') {
      node = memoizeNode(content);
      return node;
    }

    const promiseOrComponent = content();

    if (typeof promiseOrComponent === 'function') {
      node = memoizeNode(promiseOrComponent);
      return node;
    }

    node = Promise.resolve(promiseOrComponent).then(
      moduleOrComponent => {
        const component = 'default' in moduleOrComponent ? moduleOrComponent.default : moduleOrComponent;
        node = memoizeNode(component);
        return node;
      },
      error => {
        node = undefined;
        throw error;
      }
    );

    return node;
  };
}
