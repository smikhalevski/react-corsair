import { Route } from './Route';
import { RouterProvider } from './RouterProvider';
import { Location, NavigateOptions } from './types';

export class Router {
  /**
   * @hidden
   */
  constructor(protected _provider: RouterProvider<any>) {}

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
  navigate(route: Route, params: void | object, hash?: string, options?: NavigateOptions): void;

  navigate<Params>(route: Route<Params>, params: Params, hash?: string, options?: NavigateOptions): void;

  navigate<Params>(route: Route<Params>, params: Params, hash?: string, options: NavigateOptions = {}): void {
    this._provider.props.onNavigate(this.getLocation(route, params, hash), options);
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
  getLocation<Params>(route: Route<Params>, params: Params, hash?: string): Location {
    return route.matcher.createLocation({ params, hash }, this._provider.state.context);
  }
}
