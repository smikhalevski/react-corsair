import { ComponentType } from 'react';
import { Outlet } from './Outlet';
import { PathnameAdapter } from './PathnameAdapter';
import { Dict, LoadingAppearance, Location, LocationOptions, ParamsAdapter, RouteOptions } from './types';
import { isPromiseLike } from './utils';

type Squash<T> = { [K in keyof T]: T[K] } & {};

/**
 * A content returned by {@link Route.loader} and rendered by the {@link Outlet} when a route is matched by
 * a {@link Router}.
 *
 * @template Data Data loaded by a route.
 */
export interface RouteContent<Data> {
  /**
   * A route {@link RouteOptions.component component} .
   */
  component: ComponentType;

  /**
   * Data loaded by a {@link RouteOptions.loader}.
   */
  data: Data;
}

/**
 * A route that can be rendered by a router.
 *
 * @template Parent A parent route or `null` if there is no parent.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
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

  /**
   * Parses a pathname pattern, matches a pathname against this pattern, and creates a pathname from params and
   * a pattern.
   */
  pathnameAdapter: PathnameAdapter;

  /**
   * An adapter that can validate and transform params extracted from the {@link Location.pathname} and
   * {@link Location.searchParams}.
   */
  paramsAdapter: ParamsAdapter<Params> | undefined;

  /**
   * A component that is rendered when a {@link loader} is pending.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   */
  errorComponent: ComponentType | undefined;

  /**
   * A component that is rendered if {@link notFound} was called during route rendering.
   */
  notFoundComponent: ComponentType | undefined;

  /**
   * What to render when a {@link loader} is pending.
   */
  loadingAppearance: LoadingAppearance;

  /**
   * Loads a component and data that are rendered in an {@link Outlet}.
   *
   * @param params Route params.
   * @param context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
   */
  loader: (params: Params, context: Context) => Promise<RouteContent<Data>> | RouteContent<Data>;

  /**
   * Creates a new instance of a {@link Route}.
   *
   * @param parent A parent route or `null` if there is no parent.
   * @param options Route options.
   * @template Parent A parent route or `null` if there is no parent.
   * @template Params Route params.
   * @template Data Data loaded by a route.
   * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
   */
  constructor(parent: Parent, options: RouteOptions<Params, Data, Context> = {}) {
    const { pathname = '/', paramsAdapter, loadingAppearance = 'auto' } = options;

    this.parent = parent;
    this.pathnameAdapter = new PathnameAdapter(pathname, options.isCaseSensitive);
    this.paramsAdapter = typeof paramsAdapter === 'function' ? { parse: paramsAdapter } : paramsAdapter;
    this.loadingComponent = options.loadingComponent;
    this.errorComponent = options.errorComponent;
    this.notFoundComponent = options.notFoundComponent;
    this.loadingAppearance = loadingAppearance;
    this.loader = createLoader(options);
  }

  /**
   * Returns a route location.
   *
   * @param params Route params.
   * @param options Location options.
   */
  getLocation(params: this['_params'], options?: LocationOptions): Location {
    const { parent, pathnameAdapter, paramsAdapter } = this;

    let pathname;
    let searchParams: Dict = {};
    let hash;
    let state;

    if (params === undefined) {
      // No params = no search params
      searchParams = {};
      pathname = pathnameAdapter.toPathname(undefined);
    } else {
      if (paramsAdapter === undefined || paramsAdapter.toSearchParams === undefined) {
        // Search params = params omit pathname params
        for (const name in params) {
          if (params.hasOwnProperty(name) && !pathnameAdapter.paramNames.has(name)) {
            searchParams[name] = params[name];
          }
        }
      } else {
        searchParams = paramsAdapter.toSearchParams(params);
      }

      pathname = pathnameAdapter.toPathname(
        paramsAdapter === undefined || paramsAdapter.toPathnameParams === undefined ? params : undefined
      );
    }

    if (parent !== null) {
      const location = parent.getLocation(params, options);

      location.pathname += location.pathname.endsWith('/') ? pathname.substring(1) : pathname;

      // Merge search params
      Object.assign(location.searchParams, searchParams);

      return location;
    }

    hash =
      options === undefined ||
      ((state = options.state), (hash = options.hash)) === undefined ||
      hash === '' ||
      hash === '#'
        ? ''
        : hash.charAt(0) === '#'
          ? hash
          : '#' + encodeURIComponent(hash);

    return { pathname, searchParams, hash, state };
  }

  /**
   * Prefetches a component and data of this route and its ancestors.
   *
   * @param params Route params.
   * @param context A context provided to a {@link RouteOptions.loader}.
   */
  prefetch(params: this['_params'], context: Context): void {
    for (let route: Route | null = this; route !== null; route = route.parent) {
      route.loader(params, context);
    }
  }
}

/**
 * Creates a function that loads the component and its data. The component is loaded only once, if an error occurs
 * during loading, then component is loaded the next time the loader is called.
 */
function createLoader<Params, Data, Context>(options: RouteOptions<Params, Data, Context>): Route['loader'] {
  const { lazyComponent, loader } = options;

  let component: PromiseLike<ComponentType> | ComponentType | undefined = options.component;

  if (component !== undefined && lazyComponent !== undefined) {
    throw new Error('Route must have either component or lazyComponent');
  }

  if (component === undefined && lazyComponent === undefined) {
    component = Outlet;
  }

  return (params, context) => {
    component ||= lazyComponent!().then(
      module => {
        component = module.default;

        if (typeof component === 'function') {
          return component;
        }
        component = undefined;
        throw new TypeError('Module must default-export a component');
      },
      error => {
        component = undefined;
        throw error;
      }
    );

    const data = loader?.(params, context);

    if (isPromiseLike(component) || isPromiseLike(data)) {
      return Promise.all([component, data]).then(([component, data]) => ({ component, data }));
    }

    return { component, data };
  };
}
