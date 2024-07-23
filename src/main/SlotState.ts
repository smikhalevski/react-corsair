import { ComponentType } from 'react';
import { RoutePayload } from './loadRoutes';

export interface SlotStateOptions {
  /**
   * A value that was rendered in a slot and is now replaced with a new value.
   */
  oldState?: SlotState;

  /**
   * A value that is propagated to a child slot.
   */
  childState?: SlotState;

  /**
   * A state of the route rendered in a slot.
   */
  routeState?: RoutePayload;

  /**
   * A component that is rendered when an error was thrown during a slot rendering.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered when a {@link !Suspense} boundary is hit.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered if {@link notFound} was called during rendering or of there's no route to render.
   */
  notFoundComponent?: ComponentType;
}

export class SlotState {}
