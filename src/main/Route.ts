import { ComponentType } from 'react';
import { NotFoundError } from './notFound';
import { Outlet } from './Outlet';
import { PathnameTemplate } from './PathnameTemplate';
import { Redirect } from './redirect';
import {
  Dict,
  LoadingAppearance,
  Location,
  LocationOptions,
  ParamsAdapter,
  RenderingDisposition,
  RouteOptions,
} from './types';

type Squash<T> = { [K in keyof T]: T[K] } & unknown;

type PartialToVoid<T> = Partial<T> extends T ? T | void : T;

/**
 * A route that can be rendered by a router.
 *
 * @template Parent A parent route or `null` if there is no parent.
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A context required by a data loader.
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
  declare _params: PartialToVoid<Parent extends Route ? Squash<Parent['_params'] & Params> : Params>;

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
   * @param params Route params extracted from a location.
   * @param context A {@link RouterProps.context} provided to a {@link Router}.
   */
  loader: ((params: Params, context: Context) => PromiseLike<Data> | Data) | undefined;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   */
  errorComponent: ComponentType | undefined;

  /**
   * A component that is rendered when a component or data are being loaded.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A component that is rendered if {@link notFound} was called during route rendering.
   */
  notFoundComponent: ComponentType | undefined;

  /**
   * What to render when a component or data are being loaded.
   */
  loadingAppearance: LoadingAppearance;

  /**
   * Where the route is rendered.
   */
  renderingDisposition?: RenderingDisposition;

  /**
   * Loads and caches a route component.
   */
  getComponent: () => Promise<ComponentType> | ComponentType;

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
    const { lazyComponent, paramsAdapter } = options;

    this.parent = parent;
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

    this.getComponent = () => {
      if (component !== undefined) {
        return component;
      }

      component = Promise.resolve(lazyComponent!()).then(
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

      return component;
    };
  }

  /**
   * Returns a route location.
   *
   * @param params Route params.
   * @param options Location options.
   */
  getLocation(params: this['_params'], options?: LocationOptions): Location {
    let pathname = '';
    let searchParams: Dict = {};
    let hasLooseParams = false;

    for (let route: Route | null = this; route !== null; route = route.parent) {
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

      if (this.parent === null) {
        pathnameParamNames = this.pathnameTemplate.paramNames;
      } else {
        pathnameParamNames = new Set<string>();

        for (let route: Route | null = this; route !== null; route = route.parent) {
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

  /**
   * Prefetches a component and data of this route and its ancestors.
   *
   * @param params Route params.
   * @param context A context provided to a {@link RouteOptions.loader}.
   */
  prefetch(params: this['_params'], context: 0 extends 1 & Context ? void : never): void;

  /**
   * Prefetches a component and data of this route and its ancestors.
   *
   * @param params Route params.
   * @param context A context provided to a {@link RouteOptions.loader}.
   */
  prefetch(params: this['_params'], context: Context): void;

  prefetch(params: this['_params'], context: unknown): void {
    for (let route: Route | null = this; route !== null; route = route.parent) {
      try {
        route.getComponent();
        route.loader?.(params, context);
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof Redirect) {
          return;
        }

        setTimeout(() => {
          // Force uncaught exception
          throw error;
        }, 0);
      }
    }
  }
}
