import { loadRoute } from './__loadRoute';
import { RouteMatch } from './__matchRoutes';
import { OutletState } from './__types';
import { isPromiseLike } from './__utils';
import { Router } from './Router';

/**
 * A manager of an {@link Outlet}.
 *
 * @group Routing
 */
export class OutletManager {
  /**
   * A manager from which info should be taken to render an {@link Outlet}. Usually this is a self-reference, but if
   * {@link RouteOptions.loadingAppearance} is set to "auto" then this may be equal to a manager that reflects
   * the previous navigation.
   */
  activeManager = this;

  /**
   * A manager of an enclosing {@link Outlet}.
   */
  parentManager: OutletManager | null = null;

  /**
   * A manager of a nested {@link Outlet}.
   */
  childManager: OutletManager | null = null;

  /**
   * A state of the manager, or `undefined` if state isn't loaded yet.
   */
  state: Promise<OutletState> | OutletState | undefined = undefined;

  /**
   * A context that the router had when the manager was created.
   */
  readonly context: any;

  /**
   * A controller that aborts a pending state.
   */
  protected _abortController: AbortController | null = null;

  constructor(
    /**
     * A router to which an outlet belongs.
     */
    readonly router: Router,

    /**
     * A route and params that were matched, or `null` if route wasn't found.
     */
    readonly routeMatch: Readonly<RouteMatch> | null
  ) {
    this.context = router.context;
  }

  /**
   * Returns the state of the outlet or loads a route component and data.
   */
  loadState(): Promise<OutletState> | OutletState {
    if (this.state !== undefined) {
      return this.state;
    }

    if (this.routeMatch === null) {
      this.state = { status: 'not_found' };
      return this.state;
    }

    this._abortController = new AbortController();

    const state = loadRoute(this.routeMatch, this.router.context, this._abortController.signal, false);

    this.state = state;

    if (isPromiseLike(state)) {
      state.then(nextState => {
        if (this.state === state) {
          this.setState(nextState);
        }
      });
    } else {
      this.setState(state);
    }

    return state;
  }

  setState(state: OutletState): void {
    this.activeManager = this;
    this.state = state;
    this.abort();
  }

  abort(): void {
    this._abortController?.abort();
    this._abortController = null;
  }
}
