import { Router } from './Router';
import { RouterOptions } from './types';

/**
 * Creates a router that matches a route by a location.
 *
 * @template Context A context provided to {@link RouteOptions.loader route loaders}.
 * @group Routing
 */
export function createRouter<Context>(options: RouterOptions<Context>): Router<Context>;

/**
 * Creates a router that matches a route by a location.
 *
 * @group Routing
 */
export function createRouter(options: Omit<RouterOptions<void>, 'context'>): Router<void>;

export function createRouter(options: Omit<RouterOptions<void>, 'context'>): Router {
  return new Router(options as RouterOptions<void>);
}
