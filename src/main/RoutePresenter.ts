import { Router } from './__Router';
import { AbortablePromise } from 'parallel-universe';
import { isPromiseLike } from './__utils';
import { Dict, Location } from './__types';
import { NotFoundError } from './__notFound';
import { Redirect } from './__redirect';
import { Route } from './__Route';

export interface LoadingState {
  status: 'loading';
}

export interface OkState {
  status: 'ok';
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
 * State of a {@link RoutePresenter}.
 *
 * @group Routing
 */
export type RoutePresenterState = LoadingState | OkState | ErrorState | NotFoundState | RedirectState;

/**
 * Manages route rendering in an {@link Outlet}.
 *
 * @template Context A router context.
 * @group Routing
 */
export class RoutePresenter {
  /**
   * A fallback presenter that is rendered in an {@link Outlet} while this presenter loads route component and data.
   */
  fallbackPresenter: RoutePresenter | null = null;

  /**
   * A presenter rendered in an enclosing {@link Outlet}.
   */
  parentPresenter: RoutePresenter | null = null;

  /**
   * A presenter rendered in a nested {@link Outlet}.
   */
  childPresenter: RoutePresenter | null = null;

  /**
   * The current presenter state.
   */
  state: RoutePresenterState = { status: 'loading' };

  /**
   * A promise that resolves when the route loading is completed, or `null` if there's not active loading.
   */
  pendingPromise: AbortablePromise<void> | null = null;

  /**
   * Create a new {@link RoutePresenter} instance.
   *
   * @param router The router that this presenter belongs to.
   * @param route The route this presenter loads.
   * @param params Route params.
   */
  constructor(
    readonly router: Router,
    readonly route: Route,
    readonly params: Dict
  ) {}

  /**
   * Sets the presenter state and notifies router subscribers.
   *
   * @param state The new presenter state.
   */
  setState(state: RoutePresenterState): void {
    const routerPubSub = this.router['_pubSub'];

    this.fallbackPresenter = null;
    this.state = state;

    switch (state.status) {
      case 'loading':
        routerPubSub.publish({ type: 'loading', presenter: this });
        break;

      case 'ok':
        routerPubSub.publish({ type: 'ready', presenter: this });
        break;

      case 'error':
        routerPubSub.publish({ type: 'error', presenter: this, error: state.error });
        break;

      case 'not_found':
        routerPubSub.publish({ type: 'not_found', presenter: this });
        break;

      case 'redirect':
        routerPubSub.publish({ type: 'redirect', presenter: this, to: state.to });
        break;
    }
  }

  /**
   * If route isn't being loaded, then loads route data and notifies subscribers.
   */
  reload(): void {
    if (this.pendingPromise !== null) {
      // Loading is already in progress
      return;
    }

    const abortController = new AbortController();
    const state = loadRoute(this.route, this.params, this.router.context, abortController.signal, false);

    if (!isPromiseLike(state)) {
      this.setState(state);
      return;
    }

    const promise = new AbortablePromise<void>((resolve, _reject, signal) => {
      signal.addEventListener('abort', () => {
        if (this.pendingPromise === promise) {
          this.pendingPromise = null;
        }
        abortController.abort(signal.reason);
      });

      state.then(state => {
        if (signal.aborted) {
          return;
        }
        this.pendingPromise = null;
        this.setState(state);
        resolve();
      });
    });

    const { pendingPromise } = this;

    this.pendingPromise = promise;

    // pendingPromise?.abort();

    if (this.state.status === 'loading' ? pendingPromise === undefined : this.route.loadingAppearance === 'loading') {
      this.setState({ status: 'loading' });
    }

    promise.withSignal(abortController.signal);
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
): RoutePresenterState | Promise<RoutePresenterState> {
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

export function createOkState(data: unknown): RoutePresenterState {
  return { status: 'ok', data };
}

export function createErrorState(error: unknown): RoutePresenterState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
