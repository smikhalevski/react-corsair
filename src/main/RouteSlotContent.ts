import { ComponentType } from 'react';
import { NotFoundError } from './notFound';
import { Route, RouteContent } from './Route';
import { SlotContent } from './Slot';
import { isPromiseLike } from './utils';

export interface RouterContentOptions {
  context: unknown;
  errorComponent?: ComponentType;
  loadingComponent?: ComponentType;
  notFoundComponent?: ComponentType;
}

export interface RouteSlotContentOptions extends RouterContentOptions {
  /**
   * A previous content that was rendered in this slot.
   */
  prevContent: RouteSlotContent | undefined;

  /**
   * A content rendered in the child slot.
   */
  childContent: RouteSlotContent | undefined;
  route: Route | undefined;
  params: unknown;
}

export class RouteSlotContent implements SlotContent {
  childContent: RouteSlotContent | undefined;
  promise: Promise<void> | undefined;
  component: ComponentType | undefined;
  payload: unknown;
  route: Route | undefined;
  params: unknown;
  data: unknown;
  error: unknown;

  protected _options: RouteSlotContentOptions;
  protected _prevContent: RouteSlotContent | undefined;

  constructor(options: RouteSlotContentOptions) {
    options.prevContent?._freeze();

    if (options.route === undefined) {
      this._options = options;
      this._prevContent = this;
      this.component = options.notFoundComponent;
      return;
    }

    Object.assign(this, options.prevContent);
    this._options = options;
    this._prevContent = options.prevContent;

    this._load();
  }

  setError(error: unknown): void {
    const options = this._prevContent === undefined ? this._options : this._prevContent._options;

    this.childContent = options.childContent;
    this.component = error instanceof NotFoundError ? options.notFoundComponent : options.errorComponent;
    this.payload = { error };
    this.route = options.route;
    this.params = options.params;
    this.data = undefined;
    this.error = error;
  }

  protected _setRouteContent(content: RouteContent): void {
    this.childContent = this._options.childContent;
    this.component = content.component;
    this.payload = { data: content.data };
    this.route = this._options.route;
    this.params = this._options.params;
    this.data = content.data;
    this.error = undefined;
  }

  protected _freeze(): void {
    this.promise = undefined;

    if (this._prevContent === undefined || this._prevContent === this) {
      return;
    }
    this._prevContent._freeze();
  }

  protected _load(): void {
    if (this._options.route === undefined) {
      return;
    }

    this.promise = undefined;

    let content;

    try {
      content = this._options.route.loader(this._options.params, this._options.context);
    } catch (error) {
      this._prevContent = this;
      this.setError(error);
      return;
    }

    if (!isPromiseLike(content)) {
      this._prevContent = this;
      this._setRouteContent(content);
      return;
    }

    const promise = content.then(
      content => {
        if (this.promise === promise) {
          this.promise = undefined;
          this._prevContent = this;
          this._setRouteContent(content);
        }
      },
      error => {
        if (this.promise === promise) {
          this.promise = undefined;
          this._prevContent = this;
          this.setError(error);
        }
      }
    );

    this.promise = promise;

    if (this._prevContent === undefined || this._options.route.loadingAppearance === 'loading') {
      this.childContent = this._options.childContent;
      this.component = this._options.loadingComponent;
      this.payload = undefined;
      this.route = this._options.route;
      this.params = this._options.params;
      this.data = undefined;
      this.error = undefined;
    }
  }
}
