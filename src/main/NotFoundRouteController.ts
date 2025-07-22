import { Route } from './Route.js';
import { RouteController } from './RouteController.js';
import { DataLoaderOptions } from './types.js';
import { AbortablePromise } from 'parallel-universe';
import { Router } from './Router.js';
import { noop } from './utils.js';
import { FunctionComponent } from 'react';
import { NOT_FOUND } from './notFound.js';

export class NotFoundRouteController extends RouteController<{}, void> {
  constructor(router: Router, pathname: string) {
    super(router, new NotFoundRoute(pathname), {});

    this._state = { status: 'not_found' };
    this._error = NOT_FOUND;
  }

  protected _load(
    _dataLoader: (options: DataLoaderOptions<{}, any>) => PromiseLike<void> | void
  ): AbortablePromise<void> {
    return new AbortablePromise(resolve => resolve(undefined));
  }
}

export class NotFoundRoute extends Route<null, {}, void> {
  constructor(pathname: string) {
    super(null, { pathname, component: noop as FunctionComponent });
  }
}
