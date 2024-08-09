import { PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { RouteContent, RouteState } from './loadRoutes';
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
  renderedController: SlotController;

  /**
   * A controller that is propagated to a child {@link Slot} when this controller is rendered.
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
   * An error that occurred during loading or rendering.
   */
  error: unknown;

  /**
   * `true` if {@link error} contains an actual error.
   */
  hasError: boolean;

  /**
   * Sets an error that occurred during rendering of a {@link component}.
   */
  setRenderingError(error: unknown): void;

  /**
   * Subscribes listener to controller changes.
   */
  subscribe(listener: () => void): () => void;

  /**
   * Returns a stringified route state during SSR.
   */
  getStateStr(): string | undefined;
}

/**
 * Options of a {@link SlotController}.
 */
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
  renderedController = this;
  component: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  error: unknown = undefined;
  hasError = false;
  errorComponent: ComponentType | undefined;

  private _pubSub = new PubSub();

  constructor(options: SlotControllerOptions) {
    this.component = options.notFoundComponent;
    this.loadingComponent = options.loadingComponent;
    this.errorComponent = options.errorComponent;
  }

  setRenderingError(error: unknown): void {
    if (this.hasError) {
      // Unrecoverable error
      throw error;
    }
    this.error = error;
    this.hasError = true;
    this.component = this.errorComponent;
    this._pubSub.publish();
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  getStateStr(): string | undefined {
    return undefined;
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
   * An index of a route match.
   */
  index: number;

  /**
   * A matched route.
   */
  routeMatch: RouteMatch;

  /**
   * A content of a matched route.
   */
  routeContent: Promise<RouteContent> | RouteContent;

  /**
   * Stringifies a route state during SSR.
   */
  stateStringifier?: (state: RouteState) => string;

  /**
   * A Content-Security-Policy nonce.
   */
  nonce: string | undefined;
}

export class RouteSlotController implements SlotController {
  renderedController: SlotController;
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
  stateStringifier;

  private _pubSub = new PubSub();

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
    this.renderedController = route.loadingAppearance === 'loading' ? this : prevController || this;
    this.component = this.promise = this.data = this.error = undefined;
    this.errorComponent = route.errorComponent || options.errorComponent;
    this.loadingComponent = route.loadingComponent || options.loadingComponent;
    this.notFoundComponent = route.notFoundComponent || options.notFoundComponent;
    this.childController = options.childController;
    this.stateStringifier = options.stateStringifier;
    this.index = options.index;
    this.nonce = options.nonce;

    this._setRouteContent(options.routeContent);
  }

  setRenderingError(error: unknown): void {
    if (this.hasError) {
      // Unrecoverable error
      throw error;
    }
    this.error = error;
    this.hasError = true;
    this.component = error instanceof NotFoundError ? this.notFoundComponent : this.errorComponent;
    this._pubSub.publish();
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  getStateStr(): string | undefined {
    return this.stateStringifier?.({
      data: this.data,
      error: this.error,
      hasError: this.hasError,
    });
  }

  private _setRouteContent(routeContent: Promise<RouteContent> | RouteContent): void {
    if (isPromiseLike(routeContent)) {
      const promise = routeContent.then(routeContent => {
        if (promise !== this.promise) {
          return;
        }
        this.promise = undefined;
        this._setRouteContent(routeContent);
      });

      this.promise = promise;
      this._pubSub.publish();
      return;
    }

    this.renderedController = this;
    this.component = routeContent.component || this.errorComponent;
    this.data = routeContent.data;
    this.error = routeContent.error;
    this.hasError = routeContent.hasError;
    this.promise = undefined;
    this._pubSub.publish();
  }

  private _abort(): void {
    this.promise = undefined;
    this.childController?._abort();
  }
}
