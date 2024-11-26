import { ComponentType } from 'react';
import { PathnameTemplate } from './__PathnameTemplate';
import {
  Dict,
  FallbackOptions,
  LoaderOptions,
  LoadingAppearance,
  Location,
  LocationOptions,
  ParamsAdapter,
  RenderingDisposition,
  RouteOptions,
} from './__types';
import { Outlet } from './Outlet';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type PartialVoid<T> = Partial<T> extends T ? T | void : T;

declare const PARAMS: unique symbol;
declare const CONTEXT: unique symbol;

type PARAMS = typeof PARAMS;
type CONTEXT = typeof CONTEXT;

/**
 * Infers cumulative route params.
 *
 * @group Routing
 */
export type InferParams<R extends Route> = R[PARAMS];

/**
 * Infers required router context.
 *
 * @group Routing
 */
export type InferContext<R extends Route> = R[CONTEXT];

/**
 * A route that can be rendered by a router.
 *
 * Use {@link createRoute} to create a {@link Route} instance.
 *
 * @template ParentRoute A parent route or `null` if there is no parent.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export class Route<
  ParentRoute extends Route<any, any, Context> | null = any,
  Params extends object | void = any,
  Data = any,
  Context = any,
> implements FallbackOptions
{
  /**
   * The type of cumulative route params.
   *
   * @internal
   */
  declare readonly [PARAMS]: PartialVoid<ParentRoute extends Route ? Prettify<ParentRoute[PARAMS] & Params> : Params>;

  /**
   * The type of required router context.
   *
   * @internal
   */
  declare readonly [CONTEXT]: Context;

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
   */
  paramsAdapter: ParamsAdapter<Params> | undefined;

  /**
   * Loads data required to render a route.
   *
   * @param options Loader options.
   */
  loader: ((options: LoaderOptions<Params, Context>) => PromiseLike<Data> | Data) | undefined;

  /**
   * What to render when a component or data are being loaded.
   */
  loadingAppearance: LoadingAppearance;

  /**
   * Where the route is rendered.
   */
  renderingDisposition: RenderingDisposition;

  /**
   * A component rendered by the route, or `undefined` if a {@link RouteOptions.lazyComponent} isn't yet
   * {@link loadComponent loaded}.
   */
  component: ComponentType | undefined;

  /**
   * Loads {@link RouteOptions.lazyComponent a lazy route component} once and caches it forever, unless an error
   * occurred during loading.
   */
  loadComponent: () => Promise<ComponentType>;

  errorComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

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
    this.loader = options.loader;
    this.errorComponent = options.errorComponent;
    this.loadingComponent = options.loadingComponent;
    this.notFoundComponent = options.notFoundComponent;
    this.loadingAppearance = options.loadingAppearance || 'auto';
    this.renderingDisposition = options.renderingDisposition || 'server';

    let component: Promise<ComponentType> | ComponentType | undefined = options.component;

    if (component !== undefined && lazyComponent !== undefined) {
      throw new Error('Route must have either a component or a lazyComponent');
    }

    if (component === undefined && lazyComponent === undefined) {
      component = Outlet;
    }

    this.component = component;

    this.loadComponent = () => {
      if (component !== undefined) {
        return Promise.resolve(component);
      }

      component = new Promise<{ default: ComponentType }>(resolve => resolve(lazyComponent!())).then(
        module => {
          component = module.default;

          if (typeof component === 'function') {
            this.component = component;
            return component;
          }

          component = undefined;
          throw new TypeError('Module loaded by a lazyComponent must default-export a component');
        },
        error => {
          component = undefined;
          throw error;
        }
      );

      return component;
    };
  }

  /**
   * Returns a route location.
   *
   * @param params Route params.
   * @param options Location options.
   */
  getLocation(params: InferParams<this>, options?: LocationOptions): Location {
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

      if (paramsAdapter === undefined) {
        // No adapter = no search params
        continue;
      }
      if (paramsAdapter.toSearchParams === undefined) {
        hasLooseParams = true;
        continue;
      }
      searchParams = { ...paramsAdapter.toSearchParams(params), ...searchParams };
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
      hash: options === undefined || options.hash === undefined ? '' : options.hash,
      state: options?.state,
    };
  }
}
