import { Route } from './Route';
import { RouterProvider } from './RouterProvider';
import { NavigateOptions } from './types';

export class Router {
  constructor(protected _provider: RouterProvider) {}

  get root(): Router {
    return this._provider.root.router;
  }

  get parent(): Router | null {
    return this._provider.parent === null ? null : this._provider.parent.router;
  }

  get isPending(): boolean {
    return this._provider.pendingRouteMatch !== null;
  }

  get route(): Route | null {
    return this._provider.routeMatch === null ? null : this._provider.routeMatch.route;
  }

  /**
   * Navigates the router to the given route.
   */
  navigate<Params>(route: Route<Params>, params: Params, options: NavigateOptions = {}): void {
    this._provider.onNavigate?.(this.getURL(route, params, options.fragment), options);
  }

  /**
   * Navigates to the previous route.
   */
  back(): void {
    this._provider.onBack?.();
  }

  /**
   * Returns the URL of the route that starts with {@link RouterProviderProps.base the router base}.
   */
  getURL<Params>(route: Route<Params>, params: Params, fragment?: string): string {
    return route['_urlComposer'](this._provider.base, params, fragment, this._provider.searchParamsParser);
  }

  /**
   * Throws {@link NotFoundError} and causes the router to render {@link RouterProviderProps.notFoundFallback}.
   */
  notFound() {
    this._provider.onNotFound();
  }
}

export class NotFoundError extends Error {}

NotFoundError.prototype.name = 'NotFoundError';
