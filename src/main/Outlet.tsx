import React, { Component, createContext, ReactNode, Suspense } from 'react';
import { RouteMatch } from './matchRoutes';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { Route } from './Route';
import { RouterProvider } from './Router';
import { isPromiseLike } from './utils';
import { Location } from './types';

export class OutletController {
  next: OutletController | null = null;
  route: Route | null = null;
  params: unknown = undefined;
  node: ReactNode = undefined;
  data: unknown = undefined;
  error: unknown = undefined;

  protected _promise: Promise<void> | undefined;

  constructor(
    readonly routerProvider: RouterProvider,
    readonly location: Location
  ) {}

  setError(error: unknown): void {
    this.abort();

    if (error instanceof Redirect) {
      this.abort();

      this.routerProvider.props.onNavigate?.(error.location, {
        action: error.isPermanent ? 'permanentRedirect' : 'redirect',
      });
      this.node = undefined;
      this.data = undefined;
      this.error = undefined;
    } else if (error instanceof NotFoundError) {
      this.node = this.route?.['_notFoundFallback'];
      this.data = undefined;
      this.error = undefined;
    } else {
      this.node = this.route?.['_errorFallback'];
      this.data = undefined;
      this.error = error;
    }
  }

  suspend(): void {
    if (this._promise !== undefined) {
      throw this._promise;
    }
  }

  abort(): void {
    this._promise = undefined;
  }

  load({ route, params }: RouteMatch, context: any): void {
    this.abort();

    this.route = route;
    this.params = params;

    let node;
    let data;

    try {
      node = route['_contentRenderer']();
      data = route['_dataLoader']?.(params, context);
    } catch (error) {
      this.node = route['_errorFallback'];
      this.data = undefined;
      this.error = error;
      this._promise = undefined;
      return;
    }

    if (isPromiseLike(node) || isPromiseLike(data)) {
      this.node = route['_pendingFallback'];
      this.data = undefined;
      this.error = undefined;

      const promise = (this._promise = Promise.all([node, data]).then(
        ([node, data]) => {
          if (this._promise !== promise) {
            return;
          }
          this.node = node;
          this.data = data;
          this._promise = undefined;
        },
        error => {
          if (this._promise !== promise) {
            return;
          }
          this.node = route['_errorFallback'];
          this.error = error;
          this._promise = undefined;
        }
      ));
      return;
    }

    this.node = node;
    this.data = data;
    this.error = undefined;
    this._promise = undefined;
  }
}

export const OutletControllerContext = createContext<OutletController | null>(null);

OutletControllerContext.displayName = 'OutletControllerContext';

export const NextOutletControllerContext = createContext<OutletController | null>(null);

NextOutletControllerContext.displayName = 'NextOutletControllerContext';

export class Outlet extends Component<{}, { hasError: boolean; error: unknown }> {
  static contextType = NextOutletControllerContext;

  static getDerivedStateFromError(error: unknown): Outlet['state'] {
    return { hasError: true, error };
  }

  declare context: OutletController;

  prevController;
  controller;

  constructor(props: {}, context: OutletController) {
    super(props);
    this.prevController = this.controller = context;
    this.state = { hasError: false, error: undefined };
  }

  render() {
    if (this.context === null) {
      this.controller?.abort();
      return null;
    }

    if (this.context !== this.controller) {
      this.controller.abort();
      this.controller = this.context;
    }

    if (this.state.hasError) {
      this.controller.setError(this.state.error);
    }

    return (
      <Suspense
        fallback={
          <OutletRenderer
            outlet={this}
            controller={
              this.controller.route?.['_pendingBehavior'] === 'fallback' ? this.controller : this.prevController
            }
            isSuspended={true}
          />
        }
      >
        <OutletRenderer
          outlet={this}
          controller={this.controller}
          isSuspended={false}
        />
      </Suspense>
    );
  }
}

function OutletRenderer(props: { outlet: Outlet; controller: OutletController; isSuspended: boolean }) {
  if (!props.isSuspended) {
    props.controller.suspend();
    props.outlet.prevController = props.controller;
  }

  return (
    <OutletControllerContext.Provider value={props.controller}>
      <NextOutletControllerContext.Provider value={props.controller.next}>
        {props.controller.node}
      </NextOutletControllerContext.Provider>
    </OutletControllerContext.Provider>
  );
}
