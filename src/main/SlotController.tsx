import { PubSub } from 'parallel-universe';
import React, { ComponentType, ReactNode } from 'react';
import { RouteMatch } from './matchRoutes';
import { RouteContent, RouteHydrationScript } from './content-loaders';
import { NotFoundError } from './notFound';
import { isPromiseLike } from './utils';

/**
 * A controller of a {@link Slot}.
 */
export interface SlotController {
  /**
   * A controller that is actually rendered by a {@link Slot}. This allows swapping content without UI changes.
   * For example, if a new route has {@link RouteOptions.loadingAppearance} set to `"auto"`, an old route can be kept
   * on screen until the new route finishes loading.
   */
  renderedController: SlotController;

  /**
   * A controller that is propagated to a child {@link Slot} when this controller is rendered.
   */
  childController?: SlotController;

  /**
   * A component rendered in a {@link !Suspense} body.
   */
  component?: ComponentType;

  /**
   * A component rendered in a {@link !Suspense} fallback.
   */
  fallbackComponent?: ComponentType;

  /**
   * Called if an error was thrown during rendering.
   */
  onCatch(error: unknown): void;

  /**
   * Called when a component is ready to be suspended. Throw a {@link !Promise} here to suspend the component.
   */
  onSuspend(): void;

  /**
   * Subscribes a listener to controller changes.
   */
  subscribe(listener: () => void): () => void;

  /**
   * Renders a script tag during SSR that hydrates the route rendered by the controller.
   */
  renderHydrationScript(): ReactNode;
}

/**
 * Common {@link SlotController} options.
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
 * A slot controller of a Not Found page. Rendered by router if no routes matched the provided location.
 */
export class NotFoundSlotController implements SlotController {
  renderedController = this;
  component;
  fallbackComponent;
  error: unknown = undefined;
  hasError = false;

  protected _pubSub = new PubSub();
  protected _errorComponent;

  constructor(options: SlotControllerOptions) {
    this.component = options.notFoundComponent;
    this.fallbackComponent = options.loadingComponent;

    this._errorComponent = options.errorComponent;
  }

  onCatch(error: unknown): void {
    if (this.hasError) {
      // Unrecoverable error because it occurred in an _errorComponent
      throw error;
    }

    this.component = this._errorComponent;
    this.error = error;
    this.hasError = true;
    this._pubSub.publish();
  }

  onSuspend() {
    // noop
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  renderHydrationScript(): ReactNode {
    return undefined;
  }
}

/**
 * A slot controller rendered exclusively on the server if matched route rendering disposition is client-only.
 */
export class LoadingSlotController implements SlotController {
  renderedController = this;
  component;

  constructor(loadingComponent: ComponentType | undefined) {
    this.component = loadingComponent;
  }

  onCatch(error: unknown): void {
    // Error boundaries aren't supported by React during SSR
    throw error;
  }

  onSuspend() {
    // noop
  }

  subscribe(_listener: () => void): () => void {
    // There are no subscriptions during SSR
    return undefined!;
  }

  renderHydrationScript(): ReactNode {
    return undefined;
  }
}

export interface RouteSlotControllerOptions extends SlotControllerOptions {
  /**
   * An index of a route match.
   */
  index: number;

  /**
   * A matched route and params.
   */
  routeMatch: RouteMatch;

  /**
   * A content of a matched route.
   */
  routeContent: Promise<RouteContent> | RouteContent;
}

/**
 * A slot controller that renders a matched route.
 */
export class RouteSlotController implements SlotController {
  renderedController: SlotController;
  childController: SlotController | undefined;
  component: ComponentType | undefined;
  fallbackComponent;
  route;
  params;
  data: unknown;
  error: unknown;
  status: 'ok' | 'error' | undefined;

  protected _index;
  protected _promise: Promise<void> | undefined;
  protected _pubSub = new PubSub();
  protected _errorComponent;
  protected _notFoundComponent;

  /**
   * @param replacedController A controller that is being replaced in a slot with this controller.
   * @param options Controller options.
   */
  constructor(replacedController: SlotController | undefined, options: RouteSlotControllerOptions) {
    if (replacedController instanceof RouteSlotController) {
      replacedController._abort();
    }

    const { route, params } = options.routeMatch;

    this.renderedController = route.loadingAppearance === 'loading' ? this : replacedController || this;
    this.childController = this.data = this.error = this.status = this._promise = undefined;
    this.component = this.fallbackComponent = route.loadingComponent || options.loadingComponent;
    this.component = this.renderedController.component;
    this.route = route;
    this.params = params;

    this._index = options.index;
    this._errorComponent = route.errorComponent || options.errorComponent;
    this._notFoundComponent = route.notFoundComponent || options.notFoundComponent;

    this._setContent(options.routeContent);
  }

  onCatch(error: unknown): void {
    if (this.status === 'error') {
      // Unrecoverable error because it occurred in an _errorComponent
      throw error;
    }

    this.component = this._errorComponent;
    this.error = error;
    this.status = 'error';
    this._pubSub.publish();
  }

  onSuspend(): void {
    if (this._promise !== undefined) {
      throw this._promise;
    }
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }

  renderHydrationScript(): ReactNode {
    return (
      <RouteHydrationScript
        index={this._index}
        state={{
          data: this.data,
          error: this.error,
          hasError: this.status === 'error',
        }}
      />
    );
  }

  protected _setContent(content: Promise<RouteContent> | RouteContent): void {
    if (isPromiseLike(content)) {
      const promise = content.then(content => {
        if (promise === this._promise) {
          this._promise = undefined;
          this._setContent(content);
        }
      });

      this._promise = promise;
      this._pubSub.publish();
      return;
    }

    if (content.hasError) {
      this.component = content.error instanceof NotFoundError ? this._notFoundComponent : this._errorComponent;
      this.status = 'error';
    } else {
      this.component = content.component;
      this.status = 'ok';
    }

    this.renderedController = this;
    this.data = content.data;
    this.error = content.error;
    this._promise = undefined;
    this._pubSub.publish();
  }

  protected _abort(): void {
    this._promise = undefined;

    if (this.childController instanceof RouteSlotController) {
      this.childController._abort();
    }
  }
}
