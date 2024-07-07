import { Route } from './Route';
import { RouterProvider } from './Router';
import { NavigateToRouteOptions } from './types';

/**
 * Provides components a way to trigger router navigation.
 */
export class Navigation {
  constructor(private _routerProvider: RouterProvider) {}

  /**
   * Triggers {@link RouterProps.onNavigate} with the location of the route.
   *
   * @param route The route to navigate to.
   * @param params Route params.
   * @param options Additional navigation options.
   */
  navigate<T extends Route>(route: T, params: T['_params'], options: NavigateToRouteOptions = {}): void {
    this._routerProvider.props.onNavigate?.(route.getLocation(params, options), { action: options.action || 'push' });
  }

  /**
   * Triggers {@link RouterProps.onBack}.
   */
  back(): void {
    this._routerProvider.props.onBack?.();
  }

  /**
   * Prefetch the content and data of a route and its ancestors.
   *
   * @param route The route to navigate to.
   * @param params Route params.
   */
  prefetch<T extends Route>(route: T, params: T['_params']): void {
    try {
      route['_contentRenderer']();
      route['_dataLoader']?.(params, this._routerProvider.props.context);
    } catch {
      // noop
    }
  }
}
