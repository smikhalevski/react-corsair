import { RouteMatch } from './__matchRoutes';
import { Router } from './Router';
import { AbortablePromise, PubSub } from 'parallel-universe';
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
 * Manages route state and route rendering in an {@link Outlet}.
 *
 * @template Context A router context.
 * @group Routing
 */
export class RoutePresenter<Context = any> {
  /**
   * A manager that is rendered in an {@link Outlet} while this manager loads route component and data.
   *
   * Usually this is a self-reference, but if {@link RouteOptions.loadingAppearance} is set to "auto" then this property
   * may reference a manager of the previous navigation while component and data are being loaded.
   */
  fallbackPresenter: RoutePresenter<Context> = this;

  /**
   * A manager rendered in an enclosing {@link Outlet}.
   */
  parentPresenter: RoutePresenter<Context> | null = null;

  /**
   * A manager rendered in a nested {@link Outlet}.
   */
  childPresenter: RoutePresenter<Context> | null = null;

  /**
   * An route state.
   */
  state: RoutePresenterState = { status: 'loading' };

  /**
   * A promise that is resolved when route loading is completed.
   */
  promise: AbortablePromise<void> | null = null;

  private _pubSub = new PubSub();

  /**
   * Create a new {@link RoutePresenter} instance.
   *
   * @param router A router to which an outlet belongs.
   * @param routeMatch A matched route and params.
   */
  constructor(
    readonly router: Router<Context>,
    readonly routeMatch: RouteMatch
  ) {}

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
        if (this.promise === promise) {
          this.promise = null;
        }
        abortController.abort(signal.reason);
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

    const prevPromise = this.promise;

    this.promise = promise;

    prevPromise?.abort();

    if (this.state.status !== 'loading' && this.routeMatch.route.loadingAppearance === 'loading') {
      this.setState({ status: 'loading' });
    }

    promise.withSignal(abortController.signal);
  }

  /**
   * Sets the new route state and notifies subscribers.
   *
   * @param state The route state.
   */
  setState(state: RoutePresenterState): void {
    const pubSub = this.router['_pubSub'];

    this.fallbackPresenter = this;
    this.state = state;

    switch (state.status) {
      case 'error':
        pubSub.publish({ type: 'error', routePresenter: this, error: state.error });
        break;

      case 'not_found':
        pubSub.publish({ type: 'not_found', routePresenter: this });
        break;

      case 'redirect':
        pubSub.publish({ type: 'redirect', routePresenter: this, to: state.to });
        break;
    }

    this._pubSub.publish();
  }

  /**
   * Subscribes a listener to manager state changes.
   *
   * @param listener A listener to subscribe.
   * @returns A callback that unsubscribe a listener.
   */
  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}
