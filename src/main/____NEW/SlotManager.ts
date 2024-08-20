import { Payload, RouteContent } from './loadContent';
import { RouteMatch } from './matchRoutes';
import { Router } from './Router';

export interface Slot {
  /**
   * A router that produced a slot.
   */
  router: Router;

  /**
   * A matched route and captured params.
   */
  routeMatch?: RouteMatch;

  /**
   * A content to render.
   */
  routeContent?: Payload<RouteContent>;
}

export class SlotManager {}
