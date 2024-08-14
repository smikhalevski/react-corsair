import React, { ComponentType, ReactElement, ReactNode, useId } from 'react';
import { Route } from './Route';
import { Location, RouteState } from './types';
import { InternalRouter } from './InternalRouter';

/**
 * Props of the {@link Router} component.
 *
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
 */
export interface RouterProps<Context> {
  /**
   * The location rendered by the router.
   */
  location: Partial<Location>;

  /**
   * Routes that the router can render.
   */
  routes: Route<any, any, any, Context>[];

  /**
   * An arbitrary context provided to {@link RouteOptions.loader}.
   */
  context: Context;

  /**
   * Triggered when a new location must be added to a history stack.
   */
  onPush?: (location: Location) => void;

  /**
   * Triggered when a new location must replace the current history entry.
   */
  onReplace?: (location: Location) => void;

  /**
   * Triggered when a router should be navigated to the previous location.
   */
  onBack?: () => void;

  /**
   * Children rendered by the router. If `undefined`, then an {@link Outlet} is rendered.
   */
  children?: ReactNode;

  /**
   * A component that is rendered when an error was thrown during route rendering.
   *
   * The {@link Router}-level {@link errorComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.errorComponent}.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link RouteOptions.lazyComponent} or {@link RouteOptions.loader} are being
   * loaded. Render a skeleton or a spinner in this component to notify user that a new route is being loaded.
   *
   * The {@link Router}-level {@link loadingComponent} is used only for root routes. Child routes must specify their own
   * {@link RouteOptions.loadingComponent}.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered in the {@link Outlet} if there is no route in {@link routes} that matches
   * the {@link location}.
   */
  notFoundComponent?: ComponentType;

  /**
   * Parses a route state when route is hydrated on the client after SSR.
   *
   * @param stateStr A stringified state to parse.
   * @default JSON.parse
   */
  stateParser?: (stateStr: string) => RouteState;

  /**
   * Stringifies a route state during SSR.
   *
   * @param state A route state to stringify.
   * @default JSON.stringify
   */
  stateStringifier?: (state: RouteState) => string;

  /**
   * A [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
   * nonce that should be also passed as `script-src` directive in an HTTP header.
   */
  nonce?: string;
}

/**
 * A router that renders a route that matches the provided location.
 */
export function Router(props: Omit<RouterProps<void>, 'context'>): ReactElement;

/**
 * A router that renders a route that matches the provided location.
 *
 * @template Context A context provided by a {@link Router} for a {@link RouteOptions.loader}.
 */
export function Router<Context>(props: RouterProps<Context>): ReactElement;

export function Router(props: Omit<RouterProps<void>, 'context'> | RouterProps<any>): ReactElement {
  const routerId = useId().toLowerCase();

  return (
    <InternalRouter
      {...props}
      routerId={routerId}
    />
  );
}

/**
 * @internal
 */
Router.displayName = 'Router';
