import { ComponentType } from 'react';
import { RouteMatch } from '../matchRoutes';
import { isPromiseLike } from '../utils';
import { RouteContent, RouteState } from './loadRouteContent';
import { NotFoundError } from './notFound';
import { Redirect } from './redirect';

export interface SlotManagerOptions {
  /**
   * A matched route and captured params.
   */
  routeMatch?: RouteMatch;

  /**
   * A content to render.
   */
  routeContent?: Promise<RouteContent> | RouteContent;

  /**
   * A component that is rendered if an error was thrown during a slot rendering.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a route content is being loaded.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link notFound} was called during rendering or of there's no route to render.
   */
  notFoundComponent?: ComponentType;

  /**
   * A callback to trigger a client redirect.
   */
  onRedirect?(redirect: Redirect): void;
}

export interface SlotManager {
  /**
   * A manager that is rendered by a {@link Slot}.
   */
  renderAs: SlotManager;

  /**
   * A component rendered in a {@link !Suspense} body.
   */
  component: ComponentType | undefined;

  /**
   * A component rendered in a {@link !Suspense} fallback.
   */
  fallbackComponent: ComponentType | undefined;

  /**
   * A matched route and captured params.
   */
  routeMatch: RouteMatch | undefined;

  /**
   * A state of the rendered route, or `undefined` if route content is being loaded.
   */
  routeState: RouteState | undefined;

  /**
   * Called by a {@link Slot} error boundary if an error was thrown during rendering on the client.
   */
  onCatch(error: unknown): void;

  /**
   * Called by a {@link Slot} when a component is ready to be suspended.
   */
  onSuspend(): void;

  /**
   * Aborts pending route content loading.
   */
  abort(): void;
}

export function createSlotManager(replacedManager: SlotManager | undefined, options: SlotManagerOptions): SlotManager {
  const { routeMatch, routeContent, onRedirect } = options;

  let { errorComponent, loadingComponent, notFoundComponent } = options;

  let pendingRouteContent: Promise<RouteContent> | undefined;

  const replaceContent = (routeContent: Promise<RouteContent> | RouteContent): void => {
    if (isPromiseLike(routeContent)) {
      pendingRouteContent = routeContent;

      if (manager.renderAs === manager || route.loadingAppearance === 'loading') {
        // Show a loading component
        manager.renderAs = manager;
        manager.component = loadingComponent;
        manager.routeState = undefined;
      }

      // Await route content
      routeContent.then(content => {
        if (pendingRouteContent === routeContent) {
          replaceContent(content);
        }
      });
      return;
    }

    pendingRouteContent = undefined;

    // Show a route component
    manager.renderAs = manager;
    manager.component = {
      ok: routeContent.component,
      error: errorComponent,
      notFound: notFoundComponent,
      redirect: loadingComponent,
    }[routeContent.state.status];
    manager.routeState = routeContent.state;
  };

  const manager: SlotManager = {
    renderAs: undefined!,
    routeMatch,
    routeState: undefined,
    component: loadingComponent,
    fallbackComponent: loadingComponent,

    onCatch(error) {
      if (error instanceof NotFoundError) {
        manager.component = notFoundComponent;
        manager.routeState = { status: 'notFound' };
        return;
      }

      if (error instanceof Redirect) {
        manager.component = loadingComponent;
        manager.routeState = undefined;
        onRedirect?.(error);
        return;
      }

      manager.component = errorComponent;
      manager.routeState = { status: 'error', error };
    },

    onSuspend() {
      if (manager.routeState?.status === 'redirect') {
        throw new Redirect(manager.routeState.url);
      }

      if (pendingRouteContent !== undefined) {
        throw pendingRouteContent;
      }
    },

    abort() {
      pendingRouteContent = undefined;
    },
  };

  manager.renderAs = manager;

  if (routeMatch === undefined) {
    // No match = not found
    manager.component = notFoundComponent;
    manager.routeState = { status: 'notFound' };

    return manager;
  }

  const { route } = routeMatch;

  if (route.parent !== null) {
    // Nested routes cannot use router components
    errorComponent = loadingComponent = notFoundComponent = undefined;
  }

  errorComponent = route.errorComponent || errorComponent;
  loadingComponent = manager.component = manager.fallbackComponent = route.loadingComponent || loadingComponent;
  notFoundComponent = route.notFoundComponent || notFoundComponent;

  if (routeContent !== undefined) {
    manager.renderAs = replacedManager || manager;
    replaceContent(routeContent);
  }

  return manager;
}
