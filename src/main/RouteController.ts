import { AbortablePromise } from 'parallel-universe';
import { Router } from './Router';
import { isPromiseLike, noop, toLocation } from './utils';
import { DataLoaderOptions, Dict, Location, RouterEvent, To } from './types';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { Route } from './Route';

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
   * A fallback controller that is rendered in an {@link Outlet} while this controller loads route component and data.
   */
  fallbackController: RouteController<any, any, Context> | null = null;

  /**
   * A controller rendered in an enclosing {@link Outlet}.
   */
  parentController: RouteController<any, any, Context> | null = null;

  /**
   * A controller rendered in a nested {@link Outlet}.
   */
  childController: RouteController<any, any, Context> | null = null;

  /**
   * A promise that settles when the route loading is completed, or `null` if there's no loading in progress.
   */
  loadingPromise: AbortablePromise<void> | null = null;

  /**
   * The current state of the managed route. The state is reflected by an {@link Outlet}.
   */
  state: RouteState = { status: 'loading' };

  /**
   * A router context that was provided to a {@link route} {@link RouteOptions.dataLoader data loader}.
   */
  readonly context: Context;

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
  ) {
    this.context = router.context;
  }

  /**
   * Sets {@link NotFoundState} and causes an enclosing {@link Outlet} to render a
   * {@link RouteOptions.notFoundComponent notFoundComponent}.
   */
  notFound(): void {
    this._setState({ status: 'not_found' });
  }

  /**
   * Sets {@link RedirectState} and redirects the router to a new location.
   *
   * @param to A location or a URL to redirect to.
   */
  redirect(to: To | string): void {
    this._setState({ status: 'redirect', to: typeof to === 'string' ? to : toLocation(to) });
  }

  /**
   * Sets {@link ErrorState} with provided {@link error} and notifies {@link router} subscribers.
   *
   * @param error The error.
   */
  setError(error: unknown): void {
    this._setState({ status: 'error', error });
  }

  /**
   * Returns successfully loaded route data or throws an error.
   */
  getError(): any {
    return this.state.status === 'error' ? this.state.error : undefined;
  }

  /**
   * Sets {@link OkState} with provided {@link data} and notifies {@link router} subscribers.
   *
   * @param data The route data.
   */
  setData(data: Data): void {
    this._setState({ status: 'ok', data });
  }

  /**
   * Returns successfully loaded route data or throws an error if data isn't loaded.
   */
  getData(): Data {
    if (this.state.status === 'ok') {
      return this.state.data;
    }
    throw new Error('Route does not have loaded data');
  }

  /**
   * Loads route data for this controller and its descendant controllers. Aborts {@link loadingPromise} is any.
   */
  load(): void {
    const prevState = this.state;

    this.childController?.load();

    const promise = new AbortablePromise<void>((resolve, _reject, signal) => {
      signal.addEventListener('abort', () => {
        if (this.loadingPromise === promise) {
          this.loadingPromise = null;

          if (this.state.status === 'loading') {
            this.setError(signal.reason);
          }
        }

        this.router['_pubSub'].publish({ type: 'aborted', controller: this });
      });

      const state = getOrLoadRouteState({
        route: this.route,
        router: this.router,
        params: this.params,
        context: this.context,
        signal,
        isPrefetch: false,
      });

      if (!isPromiseLike(state)) {
        this._setState(state);
        resolve();
        return;
      }

      state.then(state => {
        if (signal.aborted) {
          return;
        }
        this.loadingPromise = null;
        this._setState(state);
        resolve();
      });
    });

    promise.catch(noop);

    if (this.state !== prevState) {
      // Loading has completed or was superseded
      return;
    }

    const { loadingPromise } = this;

    this.loadingPromise = promise;

    loadingPromise?.abort();

    if (prevState.status !== 'ok' || this.route.loadingAppearance === 'loading') {
      this._setState({ status: 'loading' });
      return;
    }

    this.router['_pubSub'].publish({ type: 'loading', controller: this });
  }

  /**
   * Instantly aborts the pending route loading for this controller and its descendants.
   *
   * @param reason The abort reason that is used for rejection of the loading promise.
   */
  abort(reason?: unknown): void {
    this.childController?.abort(reason);

    this.loadingPromise?.abort(reason);
  }

  /**
   * Sets the route state and notifies the router.
   *
   * **Notes:**
   * - {@link fallbackController Fallback} is removed, so if {@link LoadingState} is set, then it would be
   * revealed to the user.
   * - Aborts {@link loadingPromise pending route loading}, unless {@link LoadingState} is set.
   *
   * @param state The new route state.
   */
  protected _setState(state: RouteState): void {
    const { status } = state;

    let event: RouterEvent;

    switch (status) {
      case 'ok':
        event = { type: 'ready', controller: this };
        break;

      case 'error':
        event = { type: 'error', controller: this, error: state.error };
        break;

      case 'not_found':
        event = { type: 'not_found', controller: this };
        break;

      case 'redirect':
        event = { type: 'redirect', controller: this, to: state.to };
        break;

      case 'loading':
        event = { type: 'loading', controller: this };
        break;

      default:
        throw new Error('Unexpected route status: ' + status);
    }

    this.fallbackController = null;
    this.state = state;

    if (state.status !== 'loading') {
      const { loadingPromise } = this;

      this.loadingPromise = null;

      loadingPromise?.abort();
    }

    this.router['_pubSub'].publish(event);
  }
}

/**
 * The state of a route that is being actively loaded.
 *
 * @group Routing
 */
export interface LoadingState {
  readonly status: 'loading';
}

/**
 * The state of a route for which the component and data were loaded.
 *
 * @template Data Data loaded by a route.
 * @group Routing
 */
export interface OkState<Data> {
  readonly status: 'ok';

  /**
   * The data loaded for a route, or `undefined` if route has no {@link RouteOptions.dataLoader dataLoader}.
   */
  readonly data: Data;
}

/**
 * @group Routing
 */
export interface ErrorState {
  readonly status: 'error';
  readonly error: unknown;
}

/**
 * @group Routing
 */
export interface NotFoundState {
  readonly status: 'not_found';
}

/**
 * @group Routing
 */
export interface RedirectState {
  readonly status: 'redirect';
  readonly to: Location | string;
}

/**
 * State used by a {@link RouteController}.
 *
 * @template Data Data loaded by a route.
 * @group Routing
 */
export type RouteState<Data = any> = LoadingState | OkState<Data> | ErrorState | NotFoundState | RedirectState;

/**
 * Loads a route component and data.
 *
 * A route component is loaded once and cached forever, while data is loaded anew on every call.
 */
export function getOrLoadRouteState(options: DataLoaderOptions<any, any>): RouteState | Promise<RouteState> {
  const { route } = options;

  let component;
  let data;

  try {
    component = route.getOrLoadComponent();

    data = route.dataLoader === undefined ? undefined : route.dataLoader(options);
  } catch (error) {
    return createErrorState(error);
  }

  if (isPromiseLike(component) || isPromiseLike(data)) {
    return Promise.all([component, data]).then(result => createOkState(result[1]), createErrorState);
  }

  return createOkState(data);
}

function createOkState(data: unknown): RouteState {
  return { status: 'ok', data };
}

export function createErrorState(error: unknown): RouteState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
