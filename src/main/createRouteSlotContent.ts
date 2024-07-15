import { RouteMatch } from './matchRoutes';
import { RouterContentOptions, RouteSlotContent } from './RouteSlotContent';

export function createRouteSlotContent(
  prevContents: RouteSlotContent[],
  routeMatches: RouteMatch[] | null,
  options: RouterContentOptions
): RouteSlotContent[] {
  const { context, errorComponent, loadingComponent, notFoundComponent } = options;

  const contents: RouteSlotContent[] = [];

  // Matched route
  if (routeMatches !== null) {
    for (let i = routeMatches.length; i-- > 0; ) {
      const route = routeMatches[i].route;

      contents[i] = new RouteSlotContent({
        prevContent: prevContents[i],
        childContent: contents[i + 1],
        route: route,
        params: routeMatches[0].params,
        context,
        errorComponent: i === 0 ? route.errorComponent || errorComponent : route.errorComponent,
        loadingComponent: i === 0 ? route.loadingComponent || loadingComponent : route.loadingComponent,
        notFoundComponent: i === 0 ? route.notFoundComponent || notFoundComponent : route.notFoundComponent,
      });
    }
  }

  // Not found
  if (contents.length === 0) {
    contents.push(
      new RouteSlotContent({
        prevContent: prevContents[0],
        childContent: undefined,
        route: undefined,
        params: undefined,
        context,
        errorComponent,
        loadingComponent,
        notFoundComponent,
      })
    );
  }

  return contents;
}
