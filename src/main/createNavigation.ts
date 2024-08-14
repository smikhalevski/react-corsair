import { matchRoutes } from './matchRoutes';
import { InternalRouter } from './InternalRouter';
import { RouterProps } from './Router';
import { To } from './types';
import { toLocation } from './utils';

/**
 * Provides components a way to trigger router navigation.
 */
export interface Navigation {
  /**
   * Triggers {@link RouterProps.onPush} with the requested location.
   *
   * @param to A location or route.
   */
  push(to: To): void;

  /**
   * Triggers {@link RouterProps.onReplace} with the requested location.
   *
   * @param to A location or route.
   */
  replace(to: To): void;

  /**
   * Triggers {@link RouterProps.onBack}.
   */
  back(): void;

  /**
   * Prefetches a component and data of a route that matched by a location.
   *
   * @param to A location or route.
   * @returns `true` if the route was prefetched, or `false` if there's no route in the router that matches the provided
   * location.
   */
  prefetch(to: To): boolean;
}

/**
 * Creates a {@link Navigation} bound to a {@link Router}.
 */
export function createNavigation(router: InternalRouter): Navigation {
  return {
    push(to) {
      router.props.onPush?.(toLocation(to));
    },

    replace(to) {
      router.props.onPush?.(toLocation(to));
    },

    back() {
      router.props.onBack?.();
    },

    prefetch(to) {
      const location = toLocation(to);
      const routeMatch = matchRoutes(location.pathname, location.searchParams, router.props.routes)?.pop();

      if (routeMatch === undefined) {
        return false;
      }
      routeMatch.route.prefetch(routeMatch.params, router.props.context);
      return true;
    },
  };
}
