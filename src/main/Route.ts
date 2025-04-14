import { ComponentType } from 'react';
import { PathnameTemplate } from './PathnameTemplate';
import {
  ComponentModule,
  DataLoaderOptions,
  Dict,
  LoadingAppearance,
  Location,
  LocationOptions,
  ParamsAdapter,
  RenderingDisposition,
  RouteOptions,
  To,
} from './types';
import { Outlet } from './Outlet';
import isDeepEqual from 'fast-deep-equal';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type PartialAsVoid<T> = Partial<T> extends T ? T | void : T;

/**
 * For testing purposes only!
 */
export declare const LOCATION_PARAMS: unique symbol;

export type LOCATION_PARAMS = typeof LOCATION_PARAMS;

declare const CONTEXT: unique symbol;

declare const DATA: unique symbol;

/**
 * Infers route location params.
 *
 * @template R The route to infer location params from.
 * @group Routing
 */
export type InferLocationParams<R extends Route> = R[LOCATION_PARAMS];

/**
 * A route that can be rendered by a router.
 *
 * **Note:** Prefer {@link createRoute} over a direct {@link Route} instantiation.
 *
 * @template ParentRoute A parent route or `null` if there is no parent.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export class Route<
  ParentRoute extends Route<any, any, Context> | null = any,
  Params extends Dict = any,
  Data = any,
  Context = any,
> {
  /**
   * The type of the route location params.
   *
   * @internal
   */
  declare readonly [LOCATION_PARAMS]: PartialAsVoid<
    ParentRoute extends Route ? Prettify<Exclude<ParentRoute[LOCATION_PARAMS], void> & Params> : Params
  >;

  /**
   * The type of the route context.
   *
   * @internal
   */
  declare readonly [CONTEXT]: Context;

  /**
   * The type of data loaded by the route.
   *
   * @internal
   */
  declare readonly [DATA]: Data;

  /**
   * A parent route or `null` if there is no parent.
   */
  readonly parentRoute: ParentRoute;

  /**
   * A template of a pathname pattern.
   */
  pathnameTemplate: PathnameTemplate;

  /**
   * An adapter that can validate and transform params extracted from the {@link Location.pathname} and
   * {@link Location.searchParams}.
   *
   * If {@link paramsAdapter} throws during parsing, then route isn't matched and error is ignored.
   */
  paramsAdapter: ParamsAdapter<Params> | undefined;

  /**
   * A callback that loads data required to render a route.
   *
   * @param options Loader options.
   */
  dataLoader: ((options: DataLoaderOptions<Params, Context>) => PromiseLike<Data> | Data) | undefined;

  /**
   * A component rendered by the route, or `undefined` if a {@link RouteOptions.lazyComponent lazyComponent} isn't
   * {@link loadComponent loaded}.
   */
  component: ComponentType | undefined;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   */
  errorComponent: ComponentType | undefined;

  /**
   * A component that is rendered when a route is being loaded.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A component that is rendered if {@link react-corsair!notFound notFound} was called during route loading or
   * rendering
   */
  notFoundComponent: ComponentType | undefined;

  /**
   * What to render when a component or data are being loaded.
   */
  loadingAppearance: LoadingAppearance | undefined;

  /**
   * Where the route is rendered.
   */
  renderingDisposition: RenderingDisposition | undefined;

  /**
   * Loads {@link RouteOptions.lazyComponent} once and caches it forever, unless an error occurred during loading.
   */
  loadComponent: () => Promise<ComponentType>;

  /**
   * Creates a new instance of a {@link Route}.
   *
   * @param parentRoute A parent route or `null` if there is no parent.
   * @param options Route options.
   * @template ParentRoute A parent route or `null` if there is no parent.
   * @template Params Route params.
   * @template Data Data loaded by a route.
   * @template Context A router context.
   */
  constructor(parentRoute: ParentRoute, options: RouteOptions<Params, Data, Context> = {}) {
    const { lazyComponent, paramsAdapter } = options;

    this.parentRoute = parentRoute;
    this.pathnameTemplate = new PathnameTemplate(options.pathname || '/', options.isCaseSensitive);
    this.paramsAdapter = typeof paramsAdapter === 'function' ? { parse: paramsAdapter } : paramsAdapter;
    this.dataLoader = options.dataLoader;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
    this.loadingAppearance = options.loadingAppearance;
    this.renderingDisposition = options.renderingDisposition;

    let component = options.component;
    let promise: Promise<ComponentType> | undefined;

    if (component !== undefined && lazyComponent !== undefined) {
      throw new Error('Route must have either a component or a lazyComponent');
    }

    if (component === undefined && lazyComponent === undefined) {
      component = Outlet;
    }

    if (component !== undefined) {
      promise = Promise.resolve(component);
    }

    this.component = component;

    this.loadComponent = () => {
      if (promise !== undefined) {
        return promise;
      }

      promise = new Promise<ComponentModule>(resolve => resolve(lazyComponent!())).then(
        module => {
          const component = module.default;

          if (typeof component === 'function') {
            this.component = component;
            return component;
          }

          promise = undefined;
          throw new TypeError('Module loaded by a lazyComponent must default-export a component');
        },
        error => {
          promise = undefined;
          throw error;
        }
      );

      return promise;
    };
  }

  /**
   * Returns a route location.
   *
   * @param params Route params.
   * @param options Location options.
   */
  getLocation(params: InferLocationParams<this>, options: LocationOptions = {}): Location {
    const { hash = '', state } = options;

    let pathname = '';
    let searchParams: Dict = {};
    let hasLooseParams = false;

    for (let route: Route | null = this; route !== null; route = route.parentRoute) {
      const { paramsAdapter } = route;

      const pathnameChunk = route.pathnameTemplate.toPathname(
        paramsAdapter === undefined || paramsAdapter.toPathnameParams === undefined
          ? params
          : paramsAdapter.toPathnameParams(params)
      );

      pathname = pathnameChunk + (pathnameChunk.endsWith('/') ? pathname.substring(1) : pathname);

      if (paramsAdapter === undefined || paramsAdapter.toSearchParams === undefined) {
        hasLooseParams = true;
      } else {
        searchParams = { ...paramsAdapter.toSearchParams(params), ...searchParams };
      }
    }

    if (hasLooseParams && params !== undefined) {
      let pathnameParamNames;

      if (this.parentRoute === null) {
        pathnameParamNames = this.pathnameTemplate.paramNames;
      } else {
        pathnameParamNames = new Set<string>();

        for (let route: Route | null = this; route !== null; route = route.parentRoute) {
          for (const name of route.pathnameTemplate.paramNames) {
            pathnameParamNames.add(name);
          }
        }
      }

      for (const name in params) {
        if (params.hasOwnProperty(name) && !pathnameParamNames.has(name) && !searchParams.hasOwnProperty(name)) {
          searchParams[name] = params[name];
        }
      }
    }

    return {
      pathname,
      searchParams,
      hash: hash.length === 0 || hash.charCodeAt(0) !== 35 ? hash : decodeURIComponent(hash.substring(1)),
      state,
    };
  }
}

export function isEqualLocation(a: To | undefined, b: To | undefined): boolean {
  return a instanceof Route && b instanceof Route ? a === b : isDeepEqual(a, b);
}
