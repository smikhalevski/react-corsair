import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Router } from './Router.js';
import {
  DataLoaderOptions,
  Dict,
  LoadingAppearance,
  RenderingDisposition,
  RouterEvent,
  RouteState,
  To,
} from './types.js';
import { Route } from './Route.js';
import { ComponentType } from 'react';
import { NotFoundError } from './notFound.js';
import { Redirect } from './Redirect.js';
import { AbortablePromise } from 'parallel-universe';
import { AbortError, isPromiseLike, noop } from './utils.js';
import { RouteMatch } from './matchRoutes.js';

/**
 * Manages state of a route rendered in an {@link Outlet}.
 *
 * @template Params Route params.
 * @template Data Data loaded by a route.
 * @template Context A router context.
 * @group Routing
 */
export class RouteController<Params extends Dict = any, Data = any, Context = any> {
  /**
   * A controller rendered in an enclosing {@link Outlet}.
   */
  parentController: RouteController | null = null;

  /**
   * A controller rendered in a nested {@link Outlet}.
   */
  childController: RouteController | null = null;

  /**
   * A promise that settles when the route loading is completed, or `null` if there's no loading in progress.
   */
  promise: AbortablePromise<Data> | null = null;

  /**
   * A fallback controller that is rendered in an {@link Outlet} while this controller loads route component and data.
   */
  protected _fallbackController: RouteController | null = null;

  /**
   * The current state of the managed route. The state is reflected by an {@link Outlet}.
   */
  protected _state: RouteState<Data> = { status: 'loading' };

  /**
   * The latest error set by {@link setError}, or `undefined` if there's no error.
   */
  protected _error: unknown = undefined;

  /**
   * Creates a new {@link RouteController} instance.
   *
   * @param router The router that this controller belongs to.
   * @param route The route this controller loads.
   * @param params Route params.
   * @template Params Route params.
   * @template Data Data loaded by a route.
   * @template Context A router context.
   */
  constructor(
    readonly router: Router<Context>,
    readonly route: Route<any, Params, Data, Context>,
    readonly params: Params
  ) {}

  /**
   * Returns the stage at which the controller is currently rendered:
   *
   * <dl>
   * <dt>"foreground"</dt>
   * <dd>The route is visible to the user.</dd>
   * <dt>"background"</dt>
   * <dd>The route is being loaded while a fallback is visible to the user.</dd>
   * <dt>"fallback"</dt>
   * <dd>The route is visible to the user but would be replaced by a route that is being loaded in the background.</dd>
   * <dt>"discarded"</dt>
   * <dd>The route was replaced by another route and isn't visible to the user anymore.</dd>
   * </dl>
   */
  get renderingStage(): 'foreground' | 'background' | 'fallback' | 'discarded' {
    for (
      let controller: RouteController | null = this.router.rootController;
      controller !== null;
      controller = controller.childController
    ) {
      if (controller === this) {
        return controller._fallbackController === null ? 'foreground' : 'background';
      }
      if (controller._fallbackController === this) {
        return 'fallback';
      }
    }
    return 'discarded';
  }

  /**
   * Returns the current status of the controller:
   *
   * <dl>
   * <dt>"loading"</dt>
   * <dd>The route is being actively loaded.</dd>
   * <dt>"ready"</dt>
   * <dd>The route component and data were successfully loaded.</dd>
   * <dt>"error"</dt>
   * <dd>The route has thrown an error during rendering or from a data loader.</dd>
   * <dt>"not_found"</dt>
   * <dd>The route was marked as not found.</dd>
   * <dt>"redirect"</dt>
   * <dd>The route has requested a redirect.</dd>
   * </dl>
   */
  get status(): 'loading' | 'error' | 'not_found' | 'redirect' | 'ready' {
    return this._state.status;
  }

  /**
   * Returns the loaded route data, or throws an error if the route isn't {@link status ready}.
   */
  get data(): Data {
    if (this._state.status === 'ready') {
      return this._state.data;
    }
    throw new Error('The route data is unavailable: ' + this.status);
  }

  /**
   * Returns the error that was thrown during component or data loading, or `undefined` if {@link status} isn't "error".
   */
  get error(): any {
    return this._state.status === 'error' ? this._state.error : undefined;
  }

  /**
   * Causes an enclosing {@link Outlet} to render a {@link RouteOptions.notFoundComponent notFoundComponent}.
   */
  notFound(): void {
    this.setError(new NotFoundError());
  }

  /**
   * Redirects the router to a new location.
   *
   * @param to A location or a URL to redirect to.
   */
  redirect(to: To | string): void {
    this.setError(new Redirect(to));
  }

  /**
   * Sets an `error` and notifies {@link router} subscribers.
   *
   * @param error The error.
   */
  setError(error: any): void {
    const prevPromise = this.promise;

    this.promise = null;
    prevPromise?.abort(AbortError('The route loading was aborted'));

    this._error = error;
    this._fallbackController = null;

    if (error instanceof NotFoundError) {
      this._state = { status: 'not_found' };
      this._publish({ type: 'not_found', controller: this });
      return;
    }

    if (error instanceof Redirect) {
      this._state = { status: 'redirect', to: error.to };
      this._publish({ type: 'redirect', controller: this, to: error.to });
      return;
    }

    this._state = { status: 'error', error };
    this._publish({ type: 'error', controller: this, error });
  }

  /**
   * Sets the provided data and loads the route component if it's not loaded yet.
   *
   * @param data The route data.
   */
  setData(data: PromiseLike<Data> | Data): void {
    this._load(options => {
      return data instanceof AbortablePromise ? data.withSignal(options.signal) : data;
    });
  }

  /**
   * Reloads the data using {@link RouteOptions.dataLoader dataLoader} and component if it's not loaded yet.
   *
   * **Note:** If there's no data loader then {@link data} is set to `undefined`.
   */
  reload(): AbortablePromise<Data> {
    return this._load(options => this.route.dataLoader?.(options) as Data);
  }

  /**
   * Instantly aborts the pending route loading for this controller.
   *
   * @param reason The abort reason that is used for rejection of the loading promise.
   */
  abort(reason: unknown = AbortError('Route loading was aborted')): void {
    this.promise?.abort(reason);
  }

  /**
   * Publishes a router event.
   */
  protected _publish(event: RouterEvent): void {
    this.router['_pubSub'].publish(event);
  }

  /**
   * Loads the route data for this controller and loads the component if it's not loaded yet.
   *
   * Aborts pending {@link promise} if any.
   */
  protected _load(
    dataLoader: (options: DataLoaderOptions<Params, Context>) => PromiseLike<Data> | Data
  ): AbortablePromise<Data> {
    const { router, route, params } = this;

    const prevState = this._state;
    const prevPromise = this.promise;

    this.promise = null;
    prevPromise?.abort(AbortError('The route loading was aborted'));

    this._error = undefined;

    const promise = new AbortablePromise<Data>((resolve, reject, signal) => {
      const handleAbort = (): void => {
        if (this.promise === promise && ((this.promise = null), this._state.status === 'loading')) {
          this.setError(signal.reason);
        } else {
          // Loading was superseded or background loading was aborted
          this._publish({ type: 'aborted', controller: this });
        }
      };

      signal.addEventListener('abort', handleAbort);

      let data;

      try {
        data = dataLoader({ router, route, params, signal, isPrefetch: false });
      } catch (error) {
        // Data loader failed synchronously
        signal.removeEventListener('abort', handleAbort);

        this.setError(error);
        reject(error);
        return;
      }

      // Ensure route component is loaded
      if (route.component === undefined) {
        data = Promise.all([route.loadComponent(), data]).then(result => result[1]);
      }

      if (!isPromiseLike(data)) {
        // Component and data were loaded synchronously
        signal.removeEventListener('abort', handleAbort);

        this._fallbackController = null;
        this._state = { status: 'ready', data };
        this._publish({ type: 'ready', controller: this });

        resolve(data);
        return;
      }

      // Await component and data loading
      data.then(
        data => {
          // Component and data were successfully loaded
          signal.removeEventListener('abort', handleAbort);

          if (signal.aborted) {
            return;
          }
          this.promise = null;

          this._fallbackController = null;
          this._state = { status: 'ready', data };
          this._publish({ type: 'ready', controller: this });

          resolve(data);
        },
        error => {
          // Component and data loading have failed
          signal.removeEventListener('abort', handleAbort);

          if (signal.aborted) {
            return;
          }
          this.promise = null;
          this.setError(error);
          reject(error);
        }
      );
    });

    // Prevent unhandled promise rejections
    promise.catch(noop);

    if (prevState !== this._state) {
      // Component and data were loaded synchronously
      return promise;
    }

    // Component and data are being loaded asynchronously
    if (
      // Should always show loadingComponent
      getLoadingAppearance(this) === 'always' ||
      // Show loadingComponent to hide the current non-ready state
      (this._fallbackController === null && this._state.status !== 'ready')
    ) {
      this._fallbackController = null;
      this._state = { status: 'loading' };
    }

    this.promise = promise;
    this._publish({ type: 'loading', controller: this });

    return promise;
  }
}

export function getActiveController(controller: RouteController): RouteController;

export function getActiveController(controller: RouteController | null): RouteController | null;

/**
 * Returns the controller that should be rendered by an outlet.
 */
export function getActiveController(controller: RouteController | null): RouteController | null {
  return controller === null ? null : controller['_fallbackController'] || controller;
}

export function getErrorComponent(c: RouteController): ComponentType | undefined {
  return c.route.errorComponent || (c.parentController === null ? c.router.errorComponent : undefined);
}

export function getLoadingComponent(c: RouteController): ComponentType | undefined {
  return c.route.loadingComponent || (c.parentController === null ? c.router.loadingComponent : undefined);
}

export function getNotFoundComponent(c: RouteController): ComponentType | undefined {
  return c.route.notFoundComponent || (c.parentController === null ? c.router.notFoundComponent : undefined);
}

export function getLoadingAppearance(c: RouteController): LoadingAppearance {
  return c.route.loadingAppearance || c.router.loadingAppearance || 'reroute';
}

export function getRenderingDisposition(c: RouteController): RenderingDisposition {
  return c.route.renderingDisposition || c.router.renderingDisposition || 'server';
}

/**
 * Returns a root controller for a given array of route matches.
 *
 * @param router A router that matched routes.
 * @param evictedController The currently rendered controller that can be used as a fallback for a new controller.
 * @param routeMatches An array of matched routes and params.
 */
export function reconcileControllers(
  router: Router,
  evictedController: RouteController | null,
  routeMatches: RouteMatch[]
): RouteController | null {
  let rootController = null;
  let parentController = null;

  for (const { route, params } of routeMatches) {
    const controller = new RouteController(router, route, params);
    const loadingAppearance = getLoadingAppearance(controller);

    if (evictedController === null || evictedController.route !== route) {
      // The route has changed, so the component and data must be reloaded

      if (evictedController !== null && evictedController.status === 'ready' && loadingAppearance === 'avoid') {
        // Keep the current controller on the screen
        controller['_fallbackController'] = evictedController;
      }

      evictedController = null;
    } else if (controller.route.dataLoader !== undefined && !isDeepEqual(evictedController.params, params)) {
      // Params or a router context have changed, so data must be reloaded

      if (evictedController.status === 'ready' && loadingAppearance !== 'always') {
        // Keep the current controller on the screen
        controller['_fallbackController'] = evictedController;
      }

      evictedController = evictedController.childController;
    } else {
      // Nothing has changed

      if (evictedController.status === 'ready') {
        // The route component and data are already loaded, so reuse the state of the evicted controller

        controller['_state'] = evictedController['_state'];
      }

      evictedController = evictedController.childController;
    }

    if (parentController === null) {
      rootController = controller;
    } else {
      parentController.childController = controller;
    }

    controller.parentController = parentController;
    parentController = controller;
  }

  return rootController;
}
