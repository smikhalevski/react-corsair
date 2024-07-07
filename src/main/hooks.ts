import { Dispatch, SetStateAction, useContext } from 'react';
import { Navigation } from './Navigation';
import { OutletControllerContext } from './Outlet';
import { Route } from './Route';
import { NavigationContext } from './Router';
import { Location } from './types';

// export interface Router {
//   /**
//    * The currently rendered location.
//    */
//   location: Location;
//
//   /**
//    * The currently rendered route.
//    */
//   route: Route | null;
//
//   /**
//    * The location of a pending route.
//    */
//   pendingLocation: Location | null;
//
//   /**
//    * The route that is being loaded.
//    */
//   pendingRoute: Route | null;
//
//   /**
//    * The error encountered during route rendering.
//    */
//   error: any;
// }
//
// export declare function useRouter(): Router;

/**
 * The currently rendered location.
 */
export function useLocation(): Location {
  const controller = useContext(OutletControllerContext);

  if (controller === null) {
    throw new Error('useLocation must be used within a route content or fallback');
  }

  return controller.location;
}

/**
 * Provides components a way to trigger router navigation.
 */
export function useNavigation(): Navigation {
  const navigation = useContext(NavigationContext);

  if (navigation === null) {
    throw new Error('useNavigation must be used within a router');
  }
  return navigation;
}

/**
 * Returns params of the rendered route and callback to navigate to a location with updated params.
 *
 * **Note:** If route isn't rendered an {@link !Error} is thrown.
 */
export function useRouteParams<Params extends object | void>(
  route: Route<any, Params>
): [Params, Dispatch<SetStateAction<Params>>] {
  const controller = useContext(OutletControllerContext);

  if (controller === null) {
    throw new Error('useRouteParams must be used within a route content or fallback');
  }

  for (let controllerRoute = controller.route; controllerRoute !== null; controllerRoute = controllerRoute.parent) {
    if (controllerRoute === route) {
      return [controller.params as Params, () => undefined];
    }
  }

  throw new Error('Cannot retrieve params of a route that is not rendered');
}

/**
 * Returns the data loaded for the rendered route.
 *
 * **Note:** If route isn't rendered an {@link !Error} is thrown.
 */
export function useRouteData<Data>(route: Route<any, any, Data>): Data {
  const controller = useContext(OutletControllerContext);

  if (controller === null) {
    throw new Error('useRouteData must be used within a route content or fallback');
  }

  for (let controllerRoute = controller.route; controllerRoute !== null; controllerRoute = controllerRoute.parent) {
    if (controllerRoute === route) {
      return controller.data as Data;
    }
  }

  throw new Error('Cannot retrieve data of a route that is not rendered');
}
