import { ReactNode } from 'react';
import { Outlet } from './Outlet';
import { PathnameAdapter } from './PathnameAdapter';
import { Dict, Location, LocationOptions, RouteContent, RouteOptions } from './types';
import { memoizeElement } from './utils';

type Squash<T> = { [K in keyof T]: T[K] } & {};

/**
 * A route that can be rendered by a router.
 *
 * @template Parent A parent route or `null` if there is no parent.
 * @template Params Location params.
 * @template Data Data loaded by a route.
 * @template Context Context provided by the {@link Router} to the {@link RouteOptions.dataLoader}.
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
  protected _pendingFallback;
  protected _errorFallback;
  protected _notFoundFallback;
  protected _pendingBehavior;
  protected _contentRenderer;
  protected _dataLoader;

  /**
   * Creates a new instance of a {@link Route}.
   *
   * @param parent A parent route or `null` if there is no parent.
   * @param options Route options.
   * @template Parent A parent route or `null` if there is no parent.
   * @template Params Location params.
   * @template Data Data loaded by a route.
   * @template Context Context provided by the {@link Router} to the {@link RouteOptions.dataLoader}.
   */
  constructor(parent: Parent, options: RouteOptions<Params, Data, Context>) {
    const { paramsAdapter } = options;

    this.parent = parent;

    this._pathnameAdapter = new PathnameAdapter(options.pathname);
    this._paramsAdapter = typeof paramsAdapter === 'function' ? { parse: paramsAdapter } : paramsAdapter;
    this._pendingFallback = options.pendingFallback;
    this._errorFallback = options.errorFallback;
    this._notFoundFallback = options.notFoundFallback;
    this._pendingBehavior = options.pendingBehavior;
    this._contentRenderer = createContentRenderer(options.content);
    this._dataLoader = options.dataLoader;
  }

  /**
   * Returns a route location.
   *
   * @param params Location params.
   * @param options Additional options.
   */
  getLocation(params: this['_params'], options: LocationOptions = {}): Location {
    const { hash, state } = options;

    const pathname = this._pathnameAdapter.toPathname(params);
    const searchParams = this._getSearchParams(params);

    if (this.parent !== null) {
      const location = this.parent.getLocation(params, options);

      location.pathname += location.pathname.endsWith('/') ? pathname : '/' + pathname;

      // Combine search params
      Object.assign(location.searchParams, searchParams);

      return location;
    }

    return {
      pathname: '/' + pathname,
      searchParams,
      hash:
        hash === undefined || hash === '' || hash === '#'
          ? ''
          : hash.charAt(0) === '#'
            ? hash
            : '#' + encodeURIComponent(hash),
      state,
    };
  }

  /**
   * Converts route params to {@link Location.searchParams}.
   *
   * @param params Route params.
   * @returns Location search params.
   */
  protected _getSearchParams(params: any): Dict {
    const { _pathnameAdapter, _paramsAdapter } = this;

    if (_paramsAdapter === undefined) {
      // Only pathname params
      return {};
    }

    if (_paramsAdapter.toSearchParams !== undefined) {
      return _paramsAdapter.toSearchParams(params);
    }

    const searchParams: Dict = {};

    // Omit pathname params
    if (params !== undefined) {
      for (const paramName in params) {
        if (params.hasOwnProperty(paramName) && !_pathnameAdapter.paramNames.has(paramName)) {
          searchParams[paramName] = params[paramName];
        }
      }
    }

    return searchParams;
  }
}

/**
 * Create a function that loads the component and returns a node to render. The component is loaded only once,
 * if an error occurs during loading, then loading is retried the next time the returned render is called.
 */
function createContentRenderer(content: RouteContent): () => Promise<ReactNode> | ReactNode {
  let node: Promise<ReactNode> | ReactNode | undefined;

  if (content === undefined) {
    node = memoizeElement(Outlet);
  }

  return () => {
    if (node !== undefined) {
      return node;
    }

    if (typeof content !== 'function') {
      return (node = content);
    }

    const promiseOrComponent = content();

    if (typeof promiseOrComponent === 'function') {
      node = memoizeElement(promiseOrComponent);
      return node;
    }

    node = Promise.resolve(promiseOrComponent).then(
      moduleOrComponent => {
        const component = 'default' in moduleOrComponent ? moduleOrComponent.default : moduleOrComponent;
        node = memoizeElement(component);
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
