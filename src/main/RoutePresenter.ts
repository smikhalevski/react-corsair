import { Router } from './Router';
import { AbortablePromise } from 'parallel-universe';
import { isPromiseLike, noop } from './utils';
import { Dict, Location } from './types';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { Route } from './Route';

/**
 * State of a {@link RoutePresenter}.
 *
 * @group Routing
 */
export type RoutePresenterState = LoadingState | OkState | ErrorState | NotFoundState | RedirectState;

/**
 * Manages route rendering in an {@link Outlet}.
 *
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
   * A state of the presenter.
   */
  state: RoutePresenterState = { status: 'loading' };

  /**
   * A promise that settles when the route loading is completed, or `null` if route isn't being loaded.
   */
  loadingPromise: AbortablePromise<void> | null = null;

  /**
   * A context provided to a {@link route} {@link RouteOptions.dataLoader data loader}.
   */
  readonly routerContext;

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
    public params: Dict
  ) {
    this.routerContext = router.context;
  }

  /**
   * Forces the presenter to render {@link RouteOptions.notFoundComponent}.
   */
  notFound(): void {
    this.setError(new NotFoundError());
  }

  /**
   * Sets the presenter state to reflect an {@link error}.
   *
   * @param error The error to show.
   */
  setError(error: unknown): void {
    this.setState(createErrorState(error));
  }

  /**
   * Sets the presenter state and notifies router subscribers.
   *
   * @param state The new presenter state.
   */
  setState(state: RoutePresenterState): void {
    const routerPubSub = this.router['_pubSub'];

    this.state = state;

    if (state.status === 'loading') {
      routerPubSub.publish({ type: 'loading', presenter: this });
      return;
    }

    const { loadingPromise } = this;

    this.fallbackPresenter = null;
    this.loadingPromise = null;

    loadingPromise?.abort();

    switch (state.status) {
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
   * Reloads route data and notifies subscribers.
   */
  reload(): void {
    if (this.loadingPromise !== null) {
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

        if (this.loadingPromise === promise && this.state.status === 'loading') {
          this.setError(signal.reason);
        }
      });

      state.then(state => {
        if (signal.aborted) {
          return;
        }
        this.loadingPromise = null;
        this.setState(state);
        resolve();
      });
    });

    promise.catch(noop);

    if (this.state.status === 'loading' || this.route.loadingAppearance === 'loading') {
      this.setState({ status: 'loading' });
    }

    this.loadingPromise = promise;
  }

  /**
   * Instantly aborts pending route loading.
   *
   * @param reason The abort reason that is used for rejection of the loading promise.
   */
  abort(reason?: unknown): void {
    this.loadingPromise?.abort(reason);
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

interface LoadingState {
  status: 'loading';
}

interface OkState {
  status: 'ok';
  data: unknown;
}

interface ErrorState {
  status: 'error';
  error: unknown;
}

interface NotFoundState {
  status: 'not_found';
}

interface RedirectState {
  status: 'redirect';
  to: Location | string;
}

function createOkState(data: unknown): RoutePresenterState {
  return { status: 'ok', data };
}

function createErrorState(error: unknown): RoutePresenterState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }

  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }

  return { status: 'error', error };
}
