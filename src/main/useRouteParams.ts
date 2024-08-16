import { Route } from './Route';
import { RouteSlotController } from './SlotController';
import { useSlotController } from './useSlotController';

/**
 * Returns params of a {@link route} or throws if used outside of route component.
 *
 * @param route The route to retrieve params for.
 * @template Params Route params.
 * @group Hooks
 */
export function useRouteParams<Params extends object>(route: Route<any, Params>): Params {
  const controller = useSlotController();

  if (controller instanceof RouteSlotController && controller.route === route) {
    return controller.params as Params;
  }
  throw new Error("Route isn't rendered");
}
