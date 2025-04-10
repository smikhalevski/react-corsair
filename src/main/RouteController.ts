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
      this._supersededController = null;
      this.error = undefined;
      this._state = { status: 'loading' };
    }

    this._publish({ type: 'loading', controller: this });
  }

  reloadAll() {
    this.reload();
    this.nestedController?.reload();
  }

  retry(): void {
    if (this.status !== 'ready') {
      this.reload();
    }
  }

  retryAll(): void {
    this.retry();
    this.nestedController?.retry();
  }

  abort(reason: unknown = AbortError('The route loading was aborted')): void {
    this.loadingPromise?.abort(reason);
  }

  abortAll(reason?: unknown): void {
    this.abort(reason);
    this.nestedController?.abort(reason);
  }

  resolve(data: Data): void {
    const { loadingPromise } = this;
    this.loadingPromise = null;

    loadingPromise?.abort(AbortError('The route loading was aborted'));

    this._supersededController = null;
    this.error = undefined;
    this._state = { status: 'ready', data };
    this._publish({ type: 'ready', controller: this });
  }

  reject(error: any): void {
    const { loadingPromise } = this;
    this.loadingPromise = null;

    loadingPromise?.abort(AbortError('The route loading was aborted'));

    this._supersededController = null;
    this.error = error;

    if (error instanceof NotFoundError) {
      this._state = { status: 'not_found' };
      this._publish({ type: 'not_found', controller: this });
      return;
    } else if (error instanceof Redirect) {
      this._state = { status: 'redirect', to: error.to };
      this._publish({ type: 'redirect', controller: this, to: error.to });
      return;
    } else {
      this._state = { status: 'error', error };
      this._publish({ type: 'error', controller: this, error });
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
      _renderedState.status === status ||
      // Cannot redirect from a loadingComponent because redirect renders a loadingComponent itself
      (_renderedState.status === 'loading' && status === 'redirect') ||
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

// export class RouteController__<Params extends Dict = any, Data = any, Context = any> {
//   /**
//    * A fallback controller that is rendered in an {@link Outlet} while this controller loads route component and data.
//    */
//   fallbackController: RouteController<any, any, Context> | null = null;
//
//   /**
//    * A controller rendered in an enclosing {@link Outlet}.
//    */
//   parentController: RouteController<any, any, Context> | null = null;
//
//   /**
//    * A controller rendered in a nested {@link Outlet}.
//    */
//   childController: RouteController<any, any, Context> | null = null;
//
//   protected _context;
//
//   _state: RouteState = { status: 'loading' };
//
//   protected _renderedState = this._state;
//
//   protected _errorCause: any = undefined;
//
//   _loadingPromise: AbortablePromise<void> | null = null;
//
//   /**
//    * Creates a new {@link RouteController} instance.
//    *
//    * @param router The router that this controller belongs to.
//    * @param route The route this controller loads.
//    * @param params Route params.
//    * @template Params Route params.
//    * @template Data Data loaded by a route.
//    * @template Context A router context.
//    */
//   constructor(
//     readonly router: Router<Context>,
//     readonly route: Route<any, Params, Data, Context>,
//     readonly params: Params
//   ) {
//     this._context = router.context;
//   }
//
//   get errorComponent(): ComponentType | undefined {
//     return this.route.errorComponent || (this.parentController === null ? this.router.errorComponent : undefined);
//   }
//
//   get loadingComponent(): ComponentType | undefined {
//     return this.route.loadingComponent || (this.parentController === null ? this.router.loadingComponent : undefined);
//   }
//
//   get notFoundComponent(): ComponentType | undefined {
//     return this.route.notFoundComponent || (this.parentController === null ? this.router.notFoundComponent : undefined);
//   }
//
//   get loadingAppearance(): LoadingAppearance {
//     return this.route.loadingAppearance || this.router.loadingAppearance || 'route_loading';
//   }
//
//   get renderingDisposition(): RenderingDisposition {
//     return this.route.renderingDisposition || this.router.renderingDisposition || 'server';
//   }
//
//   /**
//    * The current status of the controller.
//    */
//   get status() {
//     return this._state.status;
//   }
//
//   /**
//    * Sets the {@link data} and notifies {@link router} subscribers.
//    *
//    * @param data The route data.
//    */
//   setData(data: Data): void {
//     this.fallbackController = null;
//     this._errorCause = undefined;
//
//     this._setState({ status: 'ready', data });
//   }
//
//   /**
//    * Returns loaded data if {@link _state} is "ready". Otherwise, throws an error.
//    */
//   getData(): Data {
//     if (this._state.status === 'ready') {
//       return this._state.data;
//     }
//     throw new Error('Route does not have data');
//   }
//
//   /**
//    * Sets an {@link error} and notifies {@link router} subscribers.
//    *
//    * @param error The error.
//    */
//   setError(error: unknown): void {
//     this.fallbackController = null;
//     this._errorCause = error;
//
//     if (error instanceof NotFoundError) {
//       this._setState({ status: 'not_found' });
//       return;
//     }
//
//     if (error instanceof Redirect) {
//       this._setState({ status: 'redirect', to: error.to });
//       return;
//     }
//
//     this._setState({ status: 'error', error });
//   }
//
//   /**
//    * Returns an error if {@link _state} is "error", or returns `undefined` if controller has any other state.
//    */
//   getError(): any {
//     return this._state.status === 'error' ? this._state.error : undefined;
//   }
//
//   /**
//    * Sets {@link NotFoundState} and causes an enclosing {@link Outlet} to render a
//    * {@link RouteOptions.notFoundComponent notFoundComponent}.
//    */
//   notFound(): void {
//     this.setError(new NotFoundError());
//   }
//
//   /**
//    * Sets the "redirect" {@link status} and notifies {@link router} subscribers.
//    *
//    * @param to A location or a URL to redirect to.
//    */
//   redirect(to: To | string): void {
//     this.setError(new Redirect(to));
//   }
//
//   /**
//    * Instantly aborts the pending route loading. If there's no pending loading then no-op.
//    *
//    * @param reason The abort reason that is used for rejection of the loading promise.
//    */
//   abort(reason: unknown = AbortError('Route loading was aborted')): void {
//     this._loadingPromise?.abort(reason);
//
//     this.childController?.abort(reason);
//   }
//
//   reload(): void {
//     if (this._loadingPromise !== null) {
//       // Loading is in progress
//       this.childController?.reload();
//       return;
//     }
//
//     this._context = this.router.context;
//
//     const prevState = this._state;
//
//     const promise = new AbortablePromise<void>((resolve, _reject, signal) => {
//       signal.addEventListener('abort', () => {
//         if (this._loadingPromise === promise) {
//           this._loadingPromise = null;
//
//           if (this._state.status === 'loading') {
//             this.setError(signal.reason);
//           }
//
//           this.router['_pubSub'].publish({ type: 'aborted', controller: this });
//         }
//       });
//
//       let data;
//
//       try {
//         data = this.route.dataLoader?.({
//           route: this.route,
//           router: this.router,
//           params: this.params,
//           signal,
//           isPrefetch: false,
//         })!;
//       } catch (error) {
//         this.setError(error);
//         resolve();
//         return;
//       }
//
//       if (this.route.component !== undefined && !isPromiseLike(data)) {
//         this.setData(data);
//         resolve();
//         return;
//       }
//
//       Promise.all([data, this.route.loadComponent()]).then(
//         ([data]) => {
//           if (signal.aborted) {
//             return;
//           }
//           this._loadingPromise = null;
//           this.setData(data);
//           resolve();
//         },
//         error => {
//           if (signal.aborted) {
//             return;
//           }
//           this._loadingPromise = null;
//           this.setError(error);
//           resolve();
//         }
//       );
//     });
//
//     promise.catch(noop);
//
//     if (this._state !== prevState) {
//       // Synchronous reload
//       this.childController?.reload();
//       return;
//     }
//
//     this._errorCause = undefined;
//     this._loadingPromise = promise;
//
//     if (this.loadingAppearance === 'loading' || prevState.status !== 'ready') {
//       this._state = { status: 'loading' };
//     }
//
//     this.router['_pubSub'].publish({ type: 'loading', controller: this });
//
//     this.childController?.reload();
//   }
//
//   protected _setState(state: RouteState) {
//     const pubSub = this.router['_pubSub'];
//
//     this._state = state;
//
//     const promise = this._loadingPromise;
//     this._loadingPromise = null;
//
//     promise?.abort(AbortError('Route loading was aborted'));
//
//     switch (state.status) {
//       case 'ready':
//         pubSub.publish({ type: 'ready', controller: this });
//         break;
//
//       case 'error':
//         pubSub.publish({ type: 'error', controller: this, error: state.error });
//         break;
//
//       case 'not_found':
//         pubSub.publish({ type: 'not_found', controller: this });
//         break;
//
//       case 'redirect':
//         pubSub.publish({ type: 'redirect', controller: this, to: state.to });
//         break;
//
//       case 'loading':
//         pubSub.publish({ type: 'loading', controller: this });
//         break;
//     }
//   }
// }
