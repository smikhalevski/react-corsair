import { loadRoute } from './__loadRoute';
import { RouteMatch } from './__matchRoutes';
import { To } from './__types';
import { isPromiseLike } from './__utils';
import { Router } from './Router';

interface OkPayload {
  status: 'ok';
  data: unknown;
}

interface ErrorPayload {
  status: 'error';
  error: unknown;
}

interface NotFoundPayload {
  status: 'not_found';
}

interface RedirectPayload {
  status: 'redirect';
  to: To | string;
}

/**
 * A payload rendered in an {@link Outlet}.
 *
 * @group Routing
 */
export type OutletPayload = OkPayload | ErrorPayload | NotFoundPayload | RedirectPayload;

/**
 * A model of an {@link Outlet}.
 */
export class OutletModel {
  /**
   * A model from which info should be taken to render an {@link Outlet}. Usually this is a self-reference, but if
   * {@link RouteOptions.loadingAppearance} is set to "auto" then this may be equal to a model that reflects
   * the previous navigation.
   */
  renderedModel = this;

  /**
   * A model of an enclosing {@link Outlet}.
   */
  parentModel: OutletModel | null = null;

  /**
   * A model of a nested {@link Outlet}.
   */
  childModel: OutletModel | null = null;

  /**
   * A payload managed by the model, or `null` is there's no payload yet.
   */
  protected _payload: Promise<OutletPayload> | OutletPayload | null = null;

  /**
   * A controller that aborts pending payload, or `null` if there's no pending payload.
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
    readonly routeMatch: RouteMatch | null
  ) {}

  getPayload(): Promise<OutletPayload> | OutletPayload {
    let payload = this._payload;

    if (payload !== null) {
      return payload;
    }

    if (this.routeMatch === null) {
      payload = { status: 'not_found' };

      this._payload = payload;
      return payload;
    }

    this._abortController = new AbortController();

    payload = loadRoute(this.routeMatch, this.router.context, this._abortController.signal, false);

    if (isPromiseLike(payload)) {
      payload.then(() => {
        if (this._payload === payload) {
          this.renderedModel = this;
          this._abortController = null;
        }
      });
    } else {
      this.renderedModel = this;
      this._abortController = null;
    }

    this._payload = payload;
    return payload;
  }

  setPayload(payload: Promise<OutletPayload> | OutletPayload): void {
    this._payload = payload;
  }

  abort(): void {
    this._abortController?.abort();
    this._abortController = null;
  }
}

/**
 * Returns an array of models for given route matches.
 */
export function reconcileOutletModel(router: Router, routeMatches: RouteMatch[]): OutletModel {
  let nextModel = null;

  for (let i = 0, parentModel = null, m; i < routeMatches.length; ++i, parentModel = m) {
    m = new OutletModel(router, routeMatches[i]);
    m.getPayload();

    if (parentModel !== null) {
      parentModel.childModel = m;
      m.parentModel = parentModel;
    }
    if (nextModel === null) {
      nextModel = m;
    }
  }

  if (nextModel === null) {
    nextModel = new OutletModel(router, null);
  }

  return nextModel;
}
