import { ComponentType } from 'react';
import { RouteMatch } from './__matchRoutes';
import { RouteContent, RouteState } from './loadRoute';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';
import { isPromiseLike } from './utils';

export interface SlotOptions {
  /**
   * A matched route and captured params.
   */
  routeMatch?: RouteMatch;

  /**
   * A slot that is replaced by a newly created slot.
   */
  replacedSlot?: Slot;
  errorComponent?: ComponentType;
  loadingComponent?: ComponentType;
  notFoundComponent?: ComponentType;
}

export class Slot {
  /**
   * A slot that is rendered on the screen.
   */
  renderedSlot: Slot;

  /**
   * A matched route and captured params.
   */
  readonly routeMatch: RouteMatch | undefined;

  /**
   * A state of the rendered route.
   */
  routeState: RouteState | undefined;

  /**
   * A promise that resolves when a route content is loaded.
   */
  promise: Promise<void> | undefined;

  /**
   * A component rendered in a {@link !Suspense} body.
   */
  component: ComponentType | undefined;

  /**
   * A component rendered in a {@link !Suspense} fallback.
   */
  fallbackComponent: ComponentType | undefined;

  errorComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;

  constructor(options: SlotOptions) {
    const { routeMatch, replacedSlot, errorComponent, loadingComponent, notFoundComponent } = options;

    this.renderedSlot = this;
    this.routeMatch = routeMatch;
    this.routeState = undefined;
    this.component = notFoundComponent;
    this.fallbackComponent = loadingComponent;
    this.errorComponent = errorComponent;
    this.loadingComponent = loadingComponent;
    this.notFoundComponent = notFoundComponent;

    if (routeMatch === undefined) {
      // Not found
      return;
    }

    const { route } = routeMatch;

    this.renderedSlot =
      replacedSlot === undefined || route.loadingAppearance === 'loading' ? this : replacedSlot.renderedSlot;

    this.errorComponent = route.errorComponent || errorComponent;
    this.loadingComponent = this.component = this.fallbackComponent = route.loadingComponent || loadingComponent;
    this.notFoundComponent = route.notFoundComponent || notFoundComponent;
  }

  setContent(content: Promise<RouteContent> | RouteContent): void {
    if (isPromiseLike(content)) {
      if (
        this.renderedSlot === this ||
        (this.routeMatch !== undefined && this.routeMatch.route.loadingAppearance === 'loading')
      ) {
        // Show a loading component
        this.renderedSlot = this;
        this.component = this.loadingComponent;
        this.routeState = undefined;
      }

      const promise = content.then(content => {
        if (this.promise === promise) {
          this.setContent(content);
        }
      });

      this.promise = promise;
      return;
    }

    // Show a route component
    this.renderedSlot = this;
    this.routeState = content.state;
    this.promise = undefined;

    switch (content.state.status) {
      case 'ok':
        this.component = content.component;
        break;

      case 'error':
        this.component = this.errorComponent;
        break;

      case 'notFound':
        this.component = this.notFoundComponent;
        break;

      case 'redirect':
        this.component = this.loadingComponent;
        break;
    }
  }

  setError(error: unknown): void {
    if (error instanceof NotFoundError) {
      this.component = this.notFoundComponent;
      return;
    }

    if (error instanceof Redirect) {
      this.component = this.loadingComponent;
      return;
    }

    this.component = this.errorComponent;
  }

  abort(): void {
    this.promise = undefined;
  }
}
