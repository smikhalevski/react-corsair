import { createElement, memo, ReactElement } from 'react';
import { ComponentLoader, Location, LocationMatch, LocationMatcher } from './types';
import { isPromiseLike } from './utils';

export interface RouteOptions<Params, Context = any> {
  matcher: LocationMatcher<Params, Context>;
  loader: ComponentLoader;
  onBeforeRender?: (match: LocationMatch<Params>, context: Context) => Promise<void> | void;
}

export class Route<Params = void, Context = any> {
  matcher;

  protected _render: (match: LocationMatch<Params>, context: Context) => Promise<ReactElement> | ReactElement;

  /**
   * Creates a route that maps pathname and params to a component.
   *
   * @param options Route options.
   */
  constructor(options: RouteOptions<Params>) {
    this.matcher = options.matcher;

    const { onBeforeRender } = options;

    const cachedRenderer = createCachedRenderer(options.loader);

    this._render = (match, context) => {
      const element = cachedRenderer();
      const promise = onBeforeRender?.(match, context);

      return isPromiseLike(promise) ? Promise.all([element, promise]).then(pair => pair[0]) : element;
    };
  }
}

/**
 * Creates a function that renders the route element or throws a promise if route isn't loaded yet.
 */
export function createSuspenseRouteRenderer(routeMatch: RouteMatch, context: any): () => ReactElement {
  let element: Promise<ReactElement> | ReactElement | undefined;

  return () => {
    if (element === undefined) {
      element = routeMatch.route['_render'](routeMatch.locationMatch, context);

      if (isPromiseLike(element)) {
        // Suspend rendering until the component is loaded
        throw (element = element.then(e => (element = e)));
      }
    }
    if (isPromiseLike(element)) {
      throw element;
    }
    return element;
  };
}

/**
 * Create a function that loads the component and returns an element to render. The component is loaded only once, if an
 * error occurs during loading, then loading is retried the next time the returned renderer is called.
 *
 * @param loader Loads the component rendered by the route.
 */
function createCachedRenderer(loader: ComponentLoader): () => Promise<ReactElement> | ReactElement {
  let element: Promise<ReactElement> | ReactElement | undefined;

  return () => {
    if (element !== undefined) {
      return element;
    }

    const component = loader();

    if (!isPromiseLike(component)) {
      element = createElement(memo(component, propsAreEqual));
      return element;
    }

    element = Promise.resolve(component).then(
      module => {
        element = createElement(memo(module.default, propsAreEqual));
        return element;
      },
      error => {
        element = undefined;
        throw error;
      }
    );
    return element;
  };
}

function propsAreEqual(_prevProps: unknown, _nextProps: unknown): boolean {
  // Route components don't receive any props, so props are always equal
  return true;
}

export interface RouteMatch {
  route: Route<any>;
  locationMatch: LocationMatch<any>;
}

/**
 * Matches a URL with a route.
 */
export function matchRoute(location: Location, context: any, routes: Route<any>[]): RouteMatch | null {
  for (const route of routes) {
    const locationMatch = route.matcher.matchLocation(location, context);

    if (locationMatch !== null) {
      return { route, locationMatch };
    }
  }
  return null;
}
