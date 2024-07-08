import { ReactNode } from 'react';
import { isPromiseLike } from './utils';
import { NotFoundError } from './notFound';
import { Route } from './Route';
import { Location } from './types';

export class OutletController {
  nestedController: OutletController | null = null;
  route: Route | null = null;
  params: any = undefined;
  node: ReactNode = undefined;
  data: any = undefined;
  error: any = undefined;
  hasError = false;

  /**
   * A promise that is resolved when route content and data are loaded.
   */
  protected _promise: Promise<void> | null = null;

  constructor(readonly location: Location) {}

  /**
   * Suspends rendering if route content and data are still being loaded.
   */
  suspend(): void {
    if (this._promise !== null) {
      throw this._promise;
    }
  }

  /**
   * Aborts the loading of the route content and data.
   */
  abort(): void {
    this._promise = null;
  }

  /**
   * Loads a route content and data.
   */
  load<Params extends object | void, Context>(
    route: Route<any, Params, any, Context>,
    params: Params,
    context: Context
  ): void {
    this.abort();

    this.route = route;
    this.params = params;

    let node;
    let data;

    try {
      node = route['_contentRenderer']();
      data = route['_dataLoader']?.(params, context);
    } catch (error) {
      this.setError(error);
      return;
    }

    if (isPromiseLike(node) || isPromiseLike(data)) {
      this.node = route['_pendingNode'];
      this.data = this.error = undefined;
      this.hasError = false;

      const promise = Promise.all([node, data]).then(
        ([node, data]) => {
          if (this._promise !== promise) {
            return;
          }
          this.node = node;
          this.data = data;
          this.error = undefined;
          this.hasError = false;
          this._promise = null;
        },
        error => {
          if (this._promise !== promise) {
            return;
          }
          this.setError(error);
          this._promise = null;
        }
      );

      this._promise = promise;
      return;
    }

    this.node = node;
    this.data = data;
    this.error = undefined;
    this.hasError = false;
  }

  setError(error: unknown): void {
    if (this.hasError && this.error === error) {
      return;
    }

    this.abort();

    this.node = this.route?.[error instanceof NotFoundError ? '_notFoundNode' : '_errorNode'];
    this.data = undefined;
    this.error = error;
    this.hasError = true;
  }
}
