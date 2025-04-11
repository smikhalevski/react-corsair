import { Router } from './Router';
import { Dict, LoadingAppearance, Location, RenderingDisposition, RouterEvent, To } from './__types';
import { Route } from './__Route';
import { ComponentType } from 'react';
import { NotFoundError } from './__notFound';
import { Redirect } from './__redirect';
import { AbortablePromise, PubSub } from 'parallel-universe';
import { AbortError, isPromiseLike, noop } from './utils';

/**
 * The state of a route that is being actively loaded.
 *
 * @group Routing
 */
export interface LoadingState {
  /**
   * The route status.
   */
  status: 'loading';
}

/**
 * The state of a route for which the component and data were loaded.
 *
 * @template Data Data loaded by a route.
 * @group Routing
 */
export interface ReadyState<Data> {
  /**
   * The route status.
   */
  status: 'ready';

  /**
   * The data loaded for a route, or `undefined` if route has no {@link RouteOptions.dataLoader dataLoader}.
   */
  data: Data;
}

/**
 * The state of a route which has thrown an error during rendering or from a data loader.
 *
 * @group Routing
 */
export interface ErrorState {
  /**
   * The route status.
   */
  status: 'error';

  /**
   * A thrown error.
   */
  error: any;
}

/**
 * The state of a route that was marked as not found.
 *
 * @group Routing
 */
export interface NotFoundState {
  /**
   * The route status.
   */
  status: 'not_found';
}

/**
 * The state of a route that has requested a redirect.
 *
 * @group Routing
 */
export interface RedirectState {
  /**
   * The route status.
   */
  status: 'redirect';

  /**
   * A location to redirect to.
   */
  to: Location | string;
}

/**
 * State used by a {@link RouteController}.
 *
 * @template Data Data loaded by a route.
 * @group Routing
 */
export type RouteState<Data = any> = LoadingState | ReadyState<Data> | ErrorState | NotFoundState | RedirectState;

export class RouteController<Params extends Dict = any, Data = any, Context = any> {
  parentController: RouteController | null = null;
  nestedController: RouteController | null = null;
  error: any = undefined;
  loadingPromise: AbortablePromise<void> | null = null;

  protected _supersededController: RouteController | null = null;
  protected _state: RouteState<Data> = { status: 'loading' };
  protected _renderedState = this._state;
  protected _context;

  constructor(
    readonly router: Router<Context>,
    readonly route: Route<any, Params, Data, Context>,
    readonly params: Params
  ) {
    this._context = this.router.context;
  }

  get status() {
    return this._state.status;
  }

  get data(): Data | undefined {
    return this._state.status === 'ready' ? this._state.data : undefined;
  }

  reload(): void {
    if (this.loadingPromise !== null) {
      // Loading in progress
      return;
    }

    const prevState = this._state;

    this._context = this.router.context;

    const promise = new AbortablePromise<void>((resolve, _reject, signal) => {
      signal.addEventListener('abort', () => {
        if (this.loadingPromise !== promise) {
          return;
        }

        this.loadingPromise = null;

        if (this._state.status === 'loading') {
          this.reject(signal.reason);
        } else {
          this._publish({ type: 'aborted', controller: this });
        }
      });

      let data;

      try {
        data = this.route.dataLoader?.({
          router: this.router,
          route: this.route,
          params: this.params,
          signal,
          isPrefetch: false,
        })!;
      } catch (error) {
        this.reject(error);
        resolve();
        return;
      }

      if (this.route.component !== undefined && !isPromiseLike(data)) {
        // Component and data are available synchronously
        this.resolve(data);
        resolve();
        return;
      }

      Promise.all([data, this.route.loadComponent()]).then(
        ([data]) => {
          if (signal.aborted) {
            return;
          }
          this.loadingPromise = null;
          this.resolve(data);
          resolve();
        },
        error => {
          if (signal.aborted) {
            return;
          }
          this.loadingPromise = null;
          this.reject(error);
          resolve();
        }
      );
    });

    if (this._state !== prevState) {
      // Synchronous reload has completed
      return;
    }

    this.loadingPromise = promise;

    if (this._loadingAppearance === 'loading' || (this._supersededController === null && this.status !== 'ready')) {
      this._setState({ status: 'loading' }, undefined);
    } else {
      this._publish({ type: 'loading', controller: this });
    }
  }

  abort(reason: unknown = AbortError('The route loading was aborted')): void {
    this.loadingPromise?.abort(reason);
  }

  resolve(data: Data): void {
    const { loadingPromise } = this;
    this.loadingPromise = null;

    loadingPromise?.abort(AbortError('The route loading was aborted'));

    this._setState({ status: 'ready', data }, undefined);
  }

  reject(error: any): void {
    const { loadingPromise } = this;
    this.loadingPromise = null;

    loadingPromise?.abort(AbortError('The route loading was aborted'));

    this._setState(toErrorState(error), error);
  }

  protected _setState(state: RouteState, error: unknown): void {
    this._supersededController = null;
    this._state = state;
    this.error = error;

    switch (state.status) {
      case 'ready':
        this._publish({ type: 'ready', controller: this });
        break;

      case 'error':
        this._publish({ type: 'error', controller: this, error: state.error });
        break;

      case 'not_found':
        this._publish({ type: 'not_found', controller: this });
        break;

      case 'redirect':
        this._publish({ type: 'redirect', controller: this, to: state.to });
        break;

      case 'loading':
        this._publish({ type: 'loading', controller: this });
        break;

      default:
        throw new Error('Unexpected route status');
    }
  }

  notFound(): void {
    this.reject(new NotFoundError());
  }

  redirect(to: To | string): void {
    this.reject(new Redirect(to));
  }

  protected get _errorComponent(): ComponentType | undefined {
    return this.route.errorComponent || (this.parentController === null ? this.router.errorComponent : undefined);
  }

  protected get _loadingComponent(): ComponentType | undefined {
    return this.route.loadingComponent || (this.parentController === null ? this.router.loadingComponent : undefined);
  }

  protected get _notFoundComponent(): ComponentType | undefined {
    return this.route.notFoundComponent || (this.parentController === null ? this.router.notFoundComponent : undefined);
  }

  protected get _loadingAppearance(): LoadingAppearance {
    return this.route.loadingAppearance || this.router.loadingAppearance || 'route_loading';
  }

  protected get _renderingDisposition(): RenderingDisposition {
    return this.route.renderingDisposition || this.router.renderingDisposition || 'server';
  }

  protected _catch(error: unknown): void {
    if (this.error !== error) {
      this.reject(error);
    }

    const { status, _renderedState } = this;

    if (
      // Cannot render the same state after it has caused an error
      status === _renderedState.status ||
      // Cannot redirect from a loadingComponent because redirect renders a loadingComponent itself
      (status === 'redirect' && _renderedState.status === 'loading') ||
      // Rendering would cause an error because there's no component to render
      (status === 'not_found' && this._notFoundComponent === undefined) ||
      (status === 'redirect' && this._loadingComponent === undefined) ||
      (status === 'error' && this._errorComponent === undefined)
    ) {
      throw error;
    }
  }

  protected _publish(event: RouterEvent): void {
    this.router['_pubSub'].publish(event);
  }
}

function toErrorState(error: unknown): RouteState {
  if (error instanceof NotFoundError) {
    return { status: 'not_found' };
  }
  if (error instanceof Redirect) {
    return { status: 'redirect', to: error.to };
  }
  return { status: 'error', error };
}
