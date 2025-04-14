import { Router } from './Router';
import { DataLoaderOptions, Dict, LoadingAppearance, RenderingDisposition, RouteState, To } from './types';
import { Route } from './Route';
import { ComponentType } from 'react';
import { NOT_FOUND } from './notFound';
import { Redirect } from './Redirect';
import { AbortablePromise } from 'parallel-universe';
import { AbortError, isPromiseLike, noop } from './utils';
import { RouteMatch } from './matchRoutes';
import isDeepEqual from 'fast-deep-equal';

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
   * A router context that was provided to a {@link route} {@link RouteOptions.dataLoader data loader}.
   */
  protected _context: Context | undefined = undefined;

  /**
   * The current state of the managed route. The state is reflected by an {@link Outlet}.
   */
  protected _state: RouteState<Data> = { status: 'loading' };

  /**
   * The last error that was set via {@link setError}, or `undefined` if controller has non-error-related state.
   */
  protected _error: any = undefined;

  /**
   * The last state rendered in an {@link Outlet}, or `undefined` if controller wasn't rendered.
   */
  protected _renderedState: RouteState<Data> | undefined = undefined;

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
   * The current status of the controller:
   *
   * <dl>
   * <dt>"loading"</dt>
   * <dd>The route is being actively loaded.</dd>
   * <dt>"ready"</dt>
   * <dd>The route component and data were successfully loaded.</dd>
   * <dt>"error"</dt>
   * <dd>The route has thrown an error during rendering or from a data loader.</dd>
   * <dt>"notFound"</dt>
   * <dd>The route was marked as not found.</dd>
   * <dt>"redirect"</dt>
   * <dd>The route has requested a redirect.</dd>
   * </dl>
   */
  get status() {
    return this._state.status;
  }

  /**
   * The successfully loaded route data.
   */
  get data(): Data {
    if (this._state.status === 'ready') {
      return this._state.data;
    }
    throw new Error("The route data isn't ready");
  }

  /**
   * The error that was thrown during component or data loading.
   */
  get error(): any {
    return this._state.status === 'error' ? this._state.error : undefined;
  }

  /**
   * Causes an enclosing {@link Outlet} to render a {@link RouteOptions.notFoundComponent notFoundComponent}.
   */
  notFound(): void {
    this.setError(NOT_FOUND);
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
   * Sets an {@link error} and notifies {@link router} subscribers.
   *
   * @param error The error.
   */
  setError(error: any): void {
    const prevPromise = this.promise;
    const pubSub = this.router['_pubSub'];

    this.promise = null;
    prevPromise?.abort(AbortError('The route loading was aborted'));

    this._fallbackController = null;
    this._error = error;

    if (error === NOT_FOUND) {
      this._state = { status: 'not_found' };
      pubSub.publish({ type: 'not_found', controller: this });
      return;
    }

    if (error instanceof Redirect) {
      this._state = { status: 'redirect', to: error.to };
      pubSub.publish({ type: 'redirect', controller: this, to: error.to });
      return;
    }

    this._state = { status: 'error', error };
    pubSub.publish({ type: 'error', controller: this, error });
  }

  /**
   * Loads route component, sets provided {@link data} and notifies {@link router} subscribers.
   *
   * @param data The route data.
   */
  setData(data: PromiseLike<Data> | Data): void {
    this._load(options => {
      return data instanceof AbortablePromise ? data.withSignal(options.signal) : data;
    });
  }

  /**
   * Reloads the data using {@link RouteOptions.dataLoader dataLoader}.
   */
  reload(): AbortablePromise<Data> {
    return this._load(options => {
      return this.route.dataLoader !== undefined ? this.route.dataLoader(options) : undefined!;
    });
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
   * Loads route data for this controller. Aborts pending {@link promise} if any.
   */
  protected _load(
    dataLoader: (options: DataLoaderOptions<Params, Context>) => PromiseLike<Data> | Data
  ): AbortablePromise<Data> {
    const { router, route, params } = this;

    const pubSub = router['_pubSub'];

    const nextContext = router.context;
    const prevState = this._state;
    const prevPromise = this.promise;

    this.promise = null;
    prevPromise?.abort(AbortError('The route loading was aborted'));

    const promise = new AbortablePromise<Data>((resolve, reject, signal) => {
      signal.addEventListener('abort', () => {
        if (this.promise !== promise || ((this.promise = null), this._state.status !== 'loading')) {
          // Loading was superseded or background loading was aborted
          pubSub.publish({ type: 'aborted', controller: this });
        } else {
          this.setError(signal.reason);
        }
      });

      let data;

      try {
        data = dataLoader({ router, route, params, signal, isPrefetch: false });
      } catch (error) {
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

        this._fallbackController = null;
        this._context = nextContext;
        this._state = { status: 'ready', data };
        pubSub.publish({ type: 'ready', controller: this });

        resolve(data);
        return;
      }

      // Await component and data loading
      data.then(
        data => {
          // Component and data were successfully loaded

          if (signal.aborted) {
            return;
          }
          this.promise = null;

          this._fallbackController = null;
          this._context = nextContext;
          this._state = { status: 'ready', data };
          pubSub.publish({ type: 'ready', controller: this });

          resolve(data);
        },
        error => {
          // Component and data loading have failed

          if (signal.aborted) {
            return;
          }
          this.promise = null;
          this.setError(error);
          reject(error);
        }
      );
    });

    promise.catch(noop);

    if (prevState !== this._state) {
      // Component and data were loaded synchronously
      return promise;
    }

    if (
      // Should always show loadingComponent
      getLoadingAppearance(this) === 'loading' ||
      // Show loadingComponent to hide the current non-ready state
      (this._fallbackController === null && this._state.status !== 'ready')
    ) {
      this._fallbackController = null;
      this._state = { status: 'loading' };
    }

    this.promise = promise;
    this._error = undefined;
    pubSub.publish({ type: 'loading', controller: this });

    return promise;
  }
}

export function getActiveController(controller: RouteController): RouteController;

export function getActiveController(controller: RouteController | null): RouteController | null;

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
  return c.route.loadingAppearance || c.router.loadingAppearance || 'route_loading';
}

export function getRenderingDisposition(c: RouteController): RenderingDisposition {
  return c.route.renderingDisposition || c.router.renderingDisposition || 'server';
}

/**
 * Called when an {@link Outlet} that renders a {@link controller} has caught an {@link error} during rendering.
 */
export function handleBoundaryError(controller: RouteController, error: unknown): void {
  controller = getActiveController(controller);

  if (controller['_error'] !== error) {
    // Prevent excessive error events
    controller.setError(error);
  }

  if (controller['_renderedState'] === undefined) {
    // Not rendered yet
    return;
  }

  const prevStatus = controller['_renderedState'].status;
  const nextStatus = controller.status;

  if (
    // Cannot render the same state after it has caused an error
    nextStatus === prevStatus ||
    // Cannot redirect from a loadingComponent because redirect renders a loadingComponent itself
    (nextStatus === 'redirect' && prevStatus === 'loading') ||
    // Rendering would cause an error because there's no component to render
    (nextStatus === 'not_found' && getNotFoundComponent(controller) === undefined) ||
    (nextStatus === 'redirect' && getLoadingComponent(controller) === undefined) ||
    (nextStatus === 'error' && getErrorComponent(controller) === undefined)
  ) {
    // Rethrow an error that cannot be rendered, so an enclosing error boundary can catch it
    throw error;
  }
}

/**
 * Returns a root controller for a given array of route matches.
 *
 * @param router A router that matched routes.
 * @param evictedController The currently rendered controller that can be used as a fallback for a new controller.
 * @param routeMatches An array of matches routes and params.
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
      // Route has changed, so component and data must be reloaded

      if (evictedController !== null && evictedController.status === 'ready' && loadingAppearance === 'avoid') {
        // Keep the current controller on the screen
        controller['_fallbackController'] = evictedController;
      }

      evictedController = null;
    } else if (
      controller.route.dataLoader !== undefined &&
      (evictedController['_context'] !== router.context || !isDeepEqual(evictedController.params, params))
    ) {
      // Params or router context have changed, so data must be reloaded

      if (evictedController.status === 'ready' && loadingAppearance !== 'loading') {
        // Keep the current controller on the screen
        controller['_fallbackController'] = evictedController;
      }

      evictedController = evictedController.childController;
    } else {
      // Nothing has changed

      if (evictedController.status === 'ready') {
        // Route component and data are already loaded, so reuse the state of the evicted controller

        controller['_context'] = router.context;
        controller['_state'] = evictedController['_state'];
        controller['_error'] = evictedController['_error'];
        controller['_renderedState'] = evictedController['_renderedState'];
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
