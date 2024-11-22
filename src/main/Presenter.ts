import { PubSub } from 'parallel-universe';
import { ComponentType } from 'react';
import { loadRoute, RoutePayload } from './__loadRoute';
import { isEqualRouteMatch, RouteMatch } from './__matchRoutes';
import { Router } from './Router';
import { isPromiseLike } from './__utils';

export class Presenter {
  renderedPresenter: Presenter = this;
  parentPresenter: Presenter | null = null;
  childPresenter: Presenter | null = null;
  routePayload: Promise<RoutePayload> | RoutePayload | null = null;
  context;
  errorComponent;
  loadingComponent;
  notFoundComponent;
  isFrozen = false;

  protected _pubSub = new PubSub();

  constructor(
    router: Router,
    readonly routeMatch: RouteMatch | undefined,
    prevPresenter: Presenter | null,
    replacedPresenter: Presenter | undefined
  ) {
    let errorComponent;
    let loadingComponent;
    let notFoundComponent;

    if (prevPresenter === null) {
      errorComponent = router.errorComponent;
      loadingComponent = router.loadingComponent;
      notFoundComponent = router.notFoundComponent;
    }

    if (routeMatch !== undefined) {
      const { route } = routeMatch;

      if (route.loadingAppearance === 'auto' && replacedPresenter !== undefined) {
        this.renderedPresenter = replacedPresenter.renderedPresenter;
      }

      errorComponent = route.errorComponent || errorComponent;
      loadingComponent = route.loadingComponent || loadingComponent;
      notFoundComponent = route.notFoundComponent || notFoundComponent;
    }

    this.context = router.context;
    this.errorComponent = errorComponent;
    this.loadingComponent = loadingComponent;
    this.notFoundComponent = notFoundComponent;
  }

  reload(): void {
    const { routeMatch } = this;

    if (this.isFrozen || routeMatch === undefined) {
      return;
    }

    const payload = loadRoute(routeMatch.route, {
      params: routeMatch.params,
      context: this.context,
      signal: new AbortController().signal,
      isPreload: false,
    });

    this.routePayload = payload;

    if (isPromiseLike(payload)) {
      this.routePayload = payload.then(nextPayload => {
        if (this.routePayload === payload && !this.isFrozen) {
          this.routePayload = nextPayload;
        }
        return nextPayload;
      });
    }

    this._pubSub.publish();
  }

  freeze(): void {
    this.isFrozen = true;
  }

  getComponentOrSuspend(): ComponentType | undefined {
    const { routeMatch, routePayload } = this;

    if (routeMatch === undefined) {
      return this.notFoundComponent;
    }

    if (routePayload === null) {
      this.reload();
    }

    if (routePayload === null) {
      return this.loadingComponent;
    }

    if (isPromiseLike(routePayload)) {
      if (this.isFrozen) {
        return this.loadingComponent;
      }

      throw routePayload;
    }

    switch (routePayload.status) {
      case 'ok':
        return routeMatch.route.component;

      case 'error':
        return this.errorComponent;

      case 'not_found':
        return this.notFoundComponent;

      case 'redirect':
        return this.loadingComponent;
    }
  }

  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}

/**
 * Returns an array of presenters for given route matches.
 */
export function reconcilePresenters(
  router: Router,
  prevPresenters: Presenter[],
  routeMatches: RouteMatch[]
): Presenter[] {
  const nextPresenters = [];

  if (routeMatches.length === 0) {
    return [new Presenter(router, undefined, null, undefined)];
  }

  let i = 0;

  for (let presenter, prevPresenter = null; i < routeMatches.length; ++i, prevPresenter = presenter) {
    const match = routeMatches[i];

    if (i < prevPresenters.length) {
      presenter = prevPresenters[i];
    }

    if (
      presenter === undefined ||
      presenter.routeMatch === undefined ||
      !isEqualRouteMatch(presenter.routeMatch, match)
    ) {
      presenter?.freeze();
      presenter = new Presenter(router, match, prevPresenter, presenter);
      presenter.reload();
    }

    if (prevPresenter !== null) {
      prevPresenter.childPresenter = presenter;
    }

    nextPresenters.push(presenter);
  }

  for (let j = i; j < prevPresenters.length; ++j) {
    prevPresenters[j].freeze();
  }

  return nextPresenters;
}
