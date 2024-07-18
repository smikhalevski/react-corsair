import { matchRoutes } from './matchRoutes';
import { Router, RouterProps } from './Router';
import { To } from './types';
import { toLocation } from './utils';

/**
 * Provides components a way to trigger router navigation.
 */
export class Navigation {
  /**
   * Creates a new {@link Navigation} instance.
   *
   * @param _router A router to which navigation is attached.
   * @internal
   */
  constructor(private _router: Router<any>) {}

  /**
   * Triggers {@link RouterProps.onPush} with the requested location.
   *
   * @param to A location or route.
   */
  push(to: To): void {
    this._router.props.onPush?.(toLocation(to));
  }

  /**
   * Triggers {@link RouterProps.onReplace} with the requested location.
   *
   * @param to A location or route.
   */
  replace(to: To): void {
    this._router.props.onPush?.(toLocation(to));
  }

  /**
   * Triggers {@link RouterProps.onBack}.
   */
  back(): void {
    this._router.props.onBack?.();
  }

  /**
   * Prefetch a content of a route matched by a location and content of its ancestors.
   *
   * @param to A location or route.
   * @returns `true` if the route was prefetched, or `false` if there's no route in the router that matches the provided
   * location.
   */
  prefetch(to: To): boolean {
    const location = toLocation(to);
    const { routes, context } = this._router.props;
    const routeMatch = matchRoutes(location.pathname, location.searchParams, routes)?.pop();

    if (routeMatch === undefined) {
      return false;
    }
    routeMatch.route.prefetch(routeMatch.params, context);
    return true;
  }
}