import { Route } from './Route';
import { RouterProvider } from './RouterProvider';
import { NavigateOptions } from './types';

export class Router {
  /**
   * @hidden
   */
  constructor(protected _provider: RouterProvider) {}

  get parent(): Router | undefined {
    return this._provider.state.parent?.router;
  }

  get isPending(): boolean {
    return this._provider.state.routeMatch !== this._provider._renderedRouteMatch;
  }

  get route(): Route | undefined {
    return this._provider._renderedRouteMatch?.route;
  }

  /**
   * Navigates the router to the given route.
   */
  navigate(route: Route<void | object>, params: void | object, options?: NavigateOptions): void;

  navigate<Params>(route: Route<Params>, params: Params, options?: NavigateOptions): void;

  navigate<Params>(route: Route<Params>, params: Params, options: NavigateOptions = {}): void {
    this._provider.props.onNavigate?.(this.getURL(route, params, options.hash), options);
  }

  /**
   * Navigates to the previous route.
   */
  back(): void {
    this._provider.props.onBack?.();
  }

  /**
   * Returns the URL of the route that starts with {@link RouterProviderProps.base the router base}.
   */
  getURL<Params>(route: Route<Params>, params: Params, hash?: string): string {
    return route['_urlComposer'](this._provider.props.base, params, hash, this._provider.state.searchParamsParser!);
  }
}
