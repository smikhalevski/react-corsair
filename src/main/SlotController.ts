import { PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { RoutePayload, SSRRoutePayload } from './loadRoutes';
import { RouteMatch } from './matchRoutes';
import { NotFoundError } from './notFound';
import { Route } from './Route';
import { isPromiseLike } from './utils';

/**
 * A controller of a {@link Slot}.
 */
export interface SlotController {
  /**
   * A controller that is rendered by {@link SlotRenderer}. Enables swapping content without changes in UI. For example,
   * if a new route has {@link RouteOptions.loadingAppearance} set to `"auto"` and an old route must be kept on
   * the screen.
   */
  appearsAs: SlotController;

  /**
   * A controller that is propagated to a child {@link Slot}.
   */
  childController?: SlotController;

  /**
   * A component rendered in a {@link !Suspense} body.
   */
  component: ComponentType | undefined;

  /**
   * A component rendered in a {@link !Suspense} fallback.
   */
  loadingComponent: ComponentType | undefined;

  /**
   * A promise that is thrown in a {@link !Suspense} body if value is being loaded.
   */
  promise?: Promise<void>;

  /**
   * An index of a route match.
   */
  index?: number;

  /**
   * A Content-Security-Policy nonce.
   */
  nonce?: string;

  /**
   * Sets an error to this controller.
   */
  setRenderError(error: unknown): void;

  subscribe?(listener: () => void): () => void;

  /**
   * Returns a stringified route payload.
   */
  getPayloadStr(): string | undefined;
}

export interface SlotControllerOptions {
  /**
   * A component that is rendered when an error was thrown during a slot rendering.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link !Suspense} boundary is hit.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link notFound} was called during rendering or of there's no route to render.
   */
  notFoundComponent?: ComponentType;
}

/**
 * A slot controller of a Not Found page.
 */
export class NotFoundSlotController implements SlotController {
  appearsAs = this;
  component: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;

  hasError = false;
  errorComponent: ComponentType | undefined;

  constructor(options: SlotControllerOptions) {
    this.component = options.notFoundComponent;
    this.loadingComponent = options.loadingComponent;
    this.errorComponent = options.errorComponent;
  }

  setRenderError(error: unknown): void {
    if (this.hasError) {
      // Unrecoverable error
      throw error;
    }
    this.hasError = true;
    this.component = this.errorComponent;
  }

  getPayloadStr(): string | undefined {
    return;
  }
}

/**
 * A slot controller that renders a route.
 */
export interface RouteSlotControllerOptions extends SlotControllerOptions {
  /**
   * A controller that is propagated to a child {@link Slot}.
   */
  childController?: RouteSlotController;

  /**
   * A route match ID, used during SSR to populate a global state.
   */
  index: number;

  /**
   * A matched route.
   */
  routeMatch: RouteMatch;

  /**
   * A payload of a matched route.
   */
  routePayload: Promise<RoutePayload> | RoutePayload;

  /**
   * Stringifies a route payload during SSR.
   */
  payloadStringifier?: (payload: SSRRoutePayload) => string;

  /**
   * A Content-Security-Policy nonce.
   */
  nonce: string | undefined;
}

export class RouteSlotController implements SlotController {
  appearsAs: SlotController;
  childController: RouteSlotController | undefined;
  component: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  promise: Promise<void> | undefined;
  index: number | undefined;
  nonce: string | undefined;

  route: Route;
  params: object;
  data: unknown;
  error: unknown;
  hasError = false;
  errorComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;
  payloadStringifier;

  protected _pubSub = new PubSub();

  /**
   * @param prevController A controller that is being replaced in a slot with this controller.
   * @param options Controller options.
   */
  constructor(prevController: SlotController | undefined, options: RouteSlotControllerOptions) {
    if (prevController instanceof RouteSlotController) {
      prevController._abort();
    }

    const { route, params } = options.routeMatch;

    this.route = route;
    this.params = params;
    this.appearsAs = route.loadingAppearance === 'loading' ? this : prevController || this;
    this.component = this.promise = this.data = this.error = undefined;
    this.errorComponent = route.errorComponent || options.errorComponent;
    this.loadingComponent = route.loadingComponent || options.loadingComponent;
    this.notFoundComponent = route.notFoundComponent || options.notFoundComponent;
    this.childController = options.childController;
    this.payloadStringifier = options.payloadStringifier;
    this.index = options.index;
    this.nonce = options.nonce;

    this._setRoutePayload(options.routePayload);
  }

  protected _setRoutePayload(routePayload: Promise<RoutePayload> | RoutePayload): void {
    if (isPromiseLike(routePayload)) {
      const promise = routePayload.then(routePayload => {
        if (promise === this.promise) {
          this.promise = undefined;
          this._setRoutePayload(routePayload);
        }
      });

      this.promise = promise;
    } else {
      this.appearsAs = this;
      this.component = routePayload.component || this.errorComponent;
      this.data = routePayload.data;
      this.error = routePayload.error;
      this.hasError = routePayload.hasError;
    }
    this._pubSub.publish();
  }

  setRenderError(error: unknown): void {
    if (this.hasError) {
      // Unrecoverable error
      throw error;
    }
    this.hasError = true;
    this.component = error instanceof NotFoundError ? this.notFoundComponent : this.errorComponent;
    this._pubSub.publish();
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  protected _abort(): void {
    this.promise = undefined;
    this.childController?._abort();
  }

  getPayloadStr(): string | undefined {
    return this.payloadStringifier?.({
      data: this.data,
      error: this.error,
      hasError: this.hasError,
    });
  }
}
