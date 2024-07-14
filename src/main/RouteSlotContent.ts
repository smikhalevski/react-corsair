import { ComponentType } from 'react';
import { NotFoundError } from './notFound';
import { Route } from './Route';
import { SlotContent, SlotContentComponents } from './Slot';
import { isPromiseLike } from './utils';

export class RouteSlotContent implements SlotContent {
  promise: Promise<void> | undefined;
  renderedComponent: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  errorComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;
  data: unknown;
  error: unknown;

  constructor(
    readonly prevContent: RouteSlotContent | undefined,
    readonly childContent: RouteSlotContent | undefined,
    readonly route: Route,
    readonly params: unknown,
    context: unknown,
    options: SlotContentComponents
  ) {
    prevContent?.freeze();

    this.loadingComponent = route.loadingComponent || options.loadingComponent;
    this.errorComponent = route.errorComponent || options.errorComponent;
    this.notFoundComponent = route.notFoundComponent || options.notFoundComponent;

    this.promise = this.data = this.error = undefined;

    let content;

    try {
      content = route.loader(params, context);
    } catch (error) {
      this.setError(error);
      return;
    }

    if (isPromiseLike(content)) {
      const promise = content.then(
        content => {
          if (this.promise === promise) {
            this.promise = undefined;
            this.renderedComponent = content.component;
            this.data = content.data;
          }
        },
        error => {
          if (this.promise === promise) {
            this.promise = undefined;
            this.setError(error);
          }
        }
      );

      if (prevContent === undefined || route.loadingAppearance === 'loading') {
        this.renderedComponent = this.loadingComponent;
        this.data = undefined;
      } else {
        this.renderedComponent = prevContent.renderedComponent;
        this.data = prevContent.data;
        this.params = prevContent.params;
        this.error = prevContent.error;
      }
    } else {
      this.renderedComponent = content.component;
      this.data = content.data;
    }
  }

  setError(error: unknown): void {
    this.renderedComponent = error instanceof NotFoundError ? this.notFoundComponent : this.errorComponent;
    this.error = error;
  }

  freeze(): void {
    this.promise = undefined;
  }
}
