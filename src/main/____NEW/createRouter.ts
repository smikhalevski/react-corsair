import { Router } from './Router';
import { RouterOptions } from './types';

/**
 * Creates a router that matches routes with a location.
 *
 * @template Context A context provided by a {@link Router} to a {@link RouteOptions.loader loader}.
 * @group Routing
 */
export function createRouter<Context>(options: RouterOptions<Context>): Router<Context>;

/**
 * Creates a router that matches routes with a location.
 *
 * @group Routing
 */
export function createRouter(options: Omit<RouterOptions<void>, 'context'>): Router<void>;

export function createRouter(options: Omit<RouterOptions<void>, 'context'>): Router {
  return new Router(options as RouterOptions<void>);
}
