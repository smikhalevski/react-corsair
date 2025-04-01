import { AbortablePromise } from 'parallel-universe';
import { Router } from './Router';
import { isPromiseLike, noop } from './utils';
import { Dict, Location } from './types';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { Route } from './Route';

/**
 * The state of a route that is being actively loaded.
 */
export interface LoadingState {
  status: 'loading';
}

/**
 * The state of a route for which the component and data were loaded.
 */
export interface OkState {
  status: 'ok';

  /**
   * The data loaded for a route, or `undefined` if route has no {@link RouteOptions.dataLoader dataLoader}.
   */
  data: unknown;
}

export interface ErrorState {
  status: 'error';
  error: unknown;
}

export interface NotFoundState {
  status: 'not_found';
}

export interface RedirectState {
  status: 'redirect';
  to: Location | string;
}

/**
 * State used by a {@link RouteController}.
 *
 * @group Routing
 */
export type RouteState = LoadingState | OkState | ErrorState | NotFoundState | RedirectState;

/**
 * Manages route rendering in an {@link Outlet}.
 *
 * @group Routing
 */
export class RouteController {
  /**
   * A fallback controller that is rendered in an {@link Outlet} while this controller loads route component and data.
   */
  fallbackController: RouteController | null = null;

  /**
   * A controller rendered in an enclosing {@link Outlet}.
   */
  parentController: RouteController | null = null;

  /**
   * A controller rendered in a nested {@link Outlet}.
   */
  childController: RouteController | null = null;

  /**
   * A state of the controller.
   */
  state: RouteState = { status: 'loading' };

  /**
   * A promise that settles when the route loading is completed, or `null` if route isn't being loaded.
   */
  promise: AbortablePromise<void> | null = null;

  /**
   * A context provided to a {@link route} {@link RouteOptions.dataLoader data loader}.
   */
  readonly routerContext;

  /**
   * Create a new {@link RouteController} instance.
   *
   * @param router The router that this controller belongs to.
   * @param route The route this controller loads.
   * @param params Route params.
   */
  constructor(
    readonly router: Router,
    readonly route: Route,
    public params: Dict
  ) {
    this.routerContext = router.context;
  }

  /**
   * Forces the controller to render {@link RouteOptions.notFoundComponent notFoundComponent}.
   */
  notFound(): void {
    this.setError(new NotFoundError());
  }

  /**
   * Sets the route state to reflect an {@link error}.
   *
   * @param error The error to show.
   */
  setError(error: unknown): void {
    this.setState(createErrorState(error));
  }

  /**
   * Sets the route state and notifies router subscribers.
   *
   * @param state The new route state.
   */
  setState(state: RouteState): void {
    const routerPubSub = this.router['_pubSub'];

    this.state = state;

    if (state.status === 'loading') {
      routerPubSub.publish({ type: 'loading', controller: this });
      return;
    }

    const { promise } = this;

    this.fallbackController = null;
    this.promise = null;

    promise?.abort();

    switch (state.status) {
      case 'ok':
        routerPubSub.publish({ type: 'ready', controller: this });
        break;

      case 'error':
        routerPubSub.publish({ type: 'error', controller: this, error: state.error });
        break;

      case 'not_found':
        routerPubSub.publish({ type: 'not_found', controller: this });
        break;

      case 'redirect':
        routerPubSub.publish({ type: 'redirect', controller: this, to: state.to });
        break;
    }
  }

  /**
   * Reloads route data and notifies subscribers.
   */
  reload(): void {
    if (this.promise !== null) {
      return;
    }

    const abortController = new AbortController();
    const state = loadRoute(this.route, this.params, this.routerContext, abortController.signal, false);

    if (!isPromiseLike(state)) {
      this.setState(state);
      return;
    }

    const promise = new AbortablePromise<void>((resolve, _reject, signal) => {
      signal.addEventListener('abort', () => {
        abortController.abort(signal.reason);

        if (this.promise === promise && this.state.status === 'loading') {
          this.setError(signal.reason);
        }
      });

      state.then(state => {
        if (signal.aborted) {
          return;
        }
        this.promise = null;
        this.setState(state);
        resolve();
      });
    });

    promise.catch(noop);

    if (this.state.status === 'loading' || this.route.loadingAppearance === 'loading') {
      this.setState({ status: 'loading' });
    }

    this.promise = promise;
  }

  /**
   * Instantly aborts pending route loading.
   *
   * @param reason The abort reason that is used for rejection of the loading promise.
   */
  abort(reason?: unknown): void {
    this.promise?.abort(reason);
  }
}

/**
 * Loads a route component and data.
 *
 * A route component is loaded once and cached forever, while data is loaded anew on every call.
 */
export function loadRoute(
  route: Route,
  params: Dict,
  context: unknown,
  signal: AbortSignal,
  isPrefetch: boolean
): RouteState | Promise<RouteState> {
  let component;
  let data;

  try {
    component = route.getOrLoadComponent();

    data = route.dataLoader === undefined ? undefined : route.dataLoader({ params, context, signal, isPrefetch });
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

function createErrorState(error: unknown): RouteState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
