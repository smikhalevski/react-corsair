import { useContext } from 'react';
import { Navigation } from './Navigation';
import { OutletControllerContext } from './Outlet';
import { OutletController } from './OutletController';
import { Route } from './Route';
import { NavigationContext } from './Router';
import { Location } from './types';

/**
 * Provides components a way to trigger router navigation.
 */
export function useNavigation(): Navigation {
  const navigation = useContext(NavigationContext);

  if (navigation === null) {
    throw new Error('Forbidden outside of a router');
  }
  return navigation;
}

function useOutletController(): OutletController {
  const controller = useContext(OutletControllerContext);

  if (controller === null) {
    throw new Error('Forbidden outside of a route');
  }
  return controller;
}

/**
 * Returns the currently rendered location.
 */
export function useLocation(): Location {
  return useOutletController().location;
}

/**
 * Returns the currently rendered route.
 *
 * @returns A rendered route, or `null` if {@link RouterProps.notFoundFallback} is rendered.
 */
export function useRoute(): Route | null {
  return useOutletController().route;
}

/**
 * Returns params of the rendered route.
 *
 * @param route A route to retrieve params for.
 * @template Params Route params.
 */
export function useRouteParams<Params extends object | void>(route: Route<any, Params>): Params {
  const controller = useOutletController();

  for (let r = controller.route; r !== null; r = r.parent) {
    if (r === route) {
      return controller.params;
    }
  }

  throw new Error("Cannot retrieve params of a route that isn't rendered");
}

/**
 * Returns the data loaded for the rendered route.
 *
 * @param route A route to retrieve data for.
 * @template Data Data loaded by a route.
 */
export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  const controller = useOutletController();

  for (let r = controller.route; r !== null; r = r.parent) {
    if (r === route) {
      return controller.data;
    }
  }

  throw new Error("Cannot retrieve data of a route that isn't rendered");
}

/**
 * Returns the error thrown during data loading or route rendering.
 *
 * @returns An error, or `undefined` if there's no error.
 */
export function useRouteError(): any {
  return useOutletController().error;
}
