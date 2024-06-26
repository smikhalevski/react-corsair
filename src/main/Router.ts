import { Route } from './Route';
import { RouterProvider } from './RouterProvider';
import { NavigateOptions } from './types';

export class Router {
  constructor(protected _provider: RouterProvider) {}

  get root(): Router {
    return this._provider.root.router;
  }

  get parent(): Router | undefined {
    return this._provider.state.parent?.router;
  }

  // get isPending(): boolean {
  //   return this._provider.pendingRouteMatch !== null;
  // }

  get route(): Route | undefined {
    return this._provider.state.route;
  }

  /**
   * Navigates the router to the given route.
   */
  navigate(route: Route<void | object>, params: void | object, options?: NavigateOptions): void;

  navigate<Params>(route: Route<Params>, params: Params, options?: NavigateOptions): void;

  navigate<Params>(route: Route<Params>, params: Params, options: NavigateOptions = {}): void {
    this._provider.props.onNavigate?.(this.getURL(route, params, options.fragment), options);
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
  getURL<Params>(route: Route<Params>, params: Params, fragment?: string): string {
    return route['_urlComposer'](this._provider.props.base, params, fragment, this._provider.state.searchParamsParser!);
  }
}
