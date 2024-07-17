import { ComponentType } from 'react';
import { NotFoundError } from './notFound';
import { Route } from './Route';
import { isPromiseLike } from './utils';

export interface RouteContent {
  /**
   * A matched route, or `undefined` if there's no route.
   */
  route: Route | undefined;

  /**
   * Params of the matched {@link route}, or `undefined` if there's no route.
   */
  params: any;

  /**
   * Data loaded by a {@link RouteOptions.loader}.
   */
  data: any;

  /**
   * An error that was thrown during rendering.
   */
  error: unknown;

  /**
   * `true` if an {@link error} was thrown during rendering.
   */
  hasError: boolean;
}

export interface SlotValueOptions {
  /**
   * A value that was rendered in a slot and is now replaced with a new value.
   */
  oldValue?: SlotValue;

  /**
   * A value that is propagated to a child slot.
   */
  childValue?: SlotValue;

  /**
   * A route that is rendered in a slot.
   */
  route?: Route;

  /**
   * Params required by a {@link RouteOptions.loader}, or `undefined` if there's no {@link route}.
   */
  params?: object;

  /**
   * A context required by a {@link RouteOptions.loader}, or `undefined` if there's no {@link route}.
   */
  context?: unknown;

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
 * A value rendered by a {@link Slot}.
 */
export class SlotValue {
  routeContent: RouteContent;

  /**
   * A value that is propagated to a child slot.
   */
  childValue: SlotValue | undefined;

  /**
   * A promise that is thrown in a {@link !Suspense} body if value is being loaded.
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

  protected _oldValue: SlotValue | undefined;
  protected _childValue: SlotValue | undefined;
  protected _route: Route | undefined;
  protected _params: object | undefined;
  protected _data: unknown;
  protected _context: unknown;
  protected _errorComponent: ComponentType | undefined;
  protected _loadingComponent: ComponentType | undefined;
  protected _notFoundComponent: ComponentType | undefined;

  constructor(options: SlotValueOptions) {
    const { oldValue, route, params } = options;

    this.routeContent = {
      route,
      params,
      data: undefined,
      error: undefined,
      hasError: false,
    };

    this.childValue = this.promise = undefined;

    this._oldValue = oldValue;
    this._childValue = options.childValue;
    this._route = route;
    this._params = params;
    this._context = options.context;
    this._errorComponent = route?.errorComponent || options.errorComponent;
    this._loadingComponent = route?.loadingComponent || options.loadingComponent;
    this._notFoundComponent = route?.notFoundComponent || options.notFoundComponent;

    if (route === undefined) {
      // Render not found
      this.component = this._notFoundComponent;
      this.fallbackComponent = this._loadingComponent;
    } else if (oldValue === undefined || route.loadingAppearance === 'loading') {
      // Render loading component
      this.component = undefined;
      this.fallbackComponent = this._loadingComponent;
    } else {
      // Render an old content until a new one is loaded
      this.routeContent = oldValue.routeContent;
      this.childValue = oldValue.childValue;
      this.fallbackComponent = oldValue.component;
    }

    // Freeze the old value to prevent UI changes
    oldValue?.freeze();

    this._load();
  }

  setError(error: unknown): void {
    const value = this._oldValue || this;

    // Old value is already disposed
    if (this.component === value._errorComponent) {
      // Rethrow because an error was thrown inside error component
      throw error;
    }

    this.routeContent = {
      route: value._route,
      params: value._params,
      data: value._data,
      error,
      hasError: true,
    };

    this.component = error instanceof NotFoundError ? value._notFoundComponent : value._errorComponent;
    this.fallbackComponent = value._loadingComponent;
  }

  protected _setPayload(component: ComponentType, data: unknown): void {
    this.routeContent = {
      route: this._route,
      params: this._params,
      data,
      error: undefined,
      hasError: false,
    };

    this.childValue = this._childValue;
    this.component = component;
    this.fallbackComponent = this._loadingComponent;

    // Dispose the old value
    this._oldValue = undefined;
  }

  protected _load(): void {
    if (this._route === undefined) {
      // No route to load data for
      return;
    }

    this.promise = undefined;

    let component;
    let data;

    try {
      component = this._route.getComponent();
      data = this._route.loader?.(this._params, this._context);
    } catch (error) {
      // Dispose the old value
      this._oldValue = undefined;
      this.setError(error);
      return;
    }

    if (!isPromiseLike(component) && !isPromiseLike(data)) {
      this._setPayload(component, data);
      return;
    }

    const promise = Promise.all([component, data]).then(
      ([component, data]) => {
        if (promise === this.promise) {
          this.promise = undefined;
          this._setPayload(component, data);
        }
      },
      error => {
        if (promise === this.promise) {
          // Dispose the old value
          this.promise = this._oldValue = undefined;
          this.setError(error);
        }
      }
    );

    this.promise = promise;
  }

  /**
   * Prevents this value from changing.
   */
  freeze(): void {
    this.promise = undefined;
    this.childValue?.freeze();
  }
}
