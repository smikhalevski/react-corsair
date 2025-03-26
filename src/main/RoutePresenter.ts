import { RouteMatch } from './__matchRoutes';
import { Router } from './Router';
import { AbortablePromise } from 'parallel-universe';
import { loadRoute } from './__loadRoute';
import { isPromiseLike } from './utils';
import { Location } from './__types';

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
 * A state of a {@link RoutePresenter}.
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
   * @param router A router to which a presenter belongs.
   * @param routeMatch A matched route and params managed by the presenter.
   */
  constructor(
    readonly router: Router,
    readonly routeMatch: RouteMatch
  ) {}

  /**
   * Updates the presenter state and notifies router subscribers.
   *
   * @param state The new presenter state.
   */
  setState(state: RoutePresenterState): void {
    const pubSub = this.router['_pubSub'];

    this.fallbackPresenter = null;
    this.state = state;

    switch (state.status) {
      case 'loading':
        pubSub.publish({ type: 'loading', presenter: this });
        break;

      case 'ok':
        pubSub.publish({ type: 'ready', presenter: this });
        break;

      case 'error':
        pubSub.publish({ type: 'error', presenter: this, error: state.error });
        break;

      case 'not_found':
        pubSub.publish({ type: 'not_found', presenter: this });
        break;

      case 'redirect':
        pubSub.publish({ type: 'redirect', presenter: this, to: state.to });
        break;
    }
  }

  /**
   * Reloads route data and notifies subscribers.
   */
  reload(): void {
    const abortController = new AbortController();
    const state = loadRoute(this.routeMatch, this.router.context, abortController.signal, false);

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

    pendingPromise?.abort();

    if (
      this.state.status === 'loading'
        ? pendingPromise === undefined
        : this.routeMatch.route.loadingAppearance === 'loading'
    ) {
      this.setState({ status: 'loading' });
    }

    promise.withSignal(abortController.signal);
  }
}
