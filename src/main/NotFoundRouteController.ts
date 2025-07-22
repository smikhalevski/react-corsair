import { Route } from './Route.js';
import { noop } from './utils.js';
import { FunctionComponent } from 'react';
import { RouteController } from './RouteController.js';
import { Router } from './Router.js';
import { DataLoaderOptions } from './types.js';
import { AbortablePromise } from 'parallel-universe';
import { NotFoundError } from './notFound.js';

export class NotFoundRoute extends Route<null, {}, void> {
  constructor(pathname: string) {
    super(null, { pathname, component: noop as FunctionComponent });
  }
}

export class NotFoundRouteController extends RouteController<{}, void> {
  constructor(router: Router, pathname: string) {
    super(router, new NotFoundRoute(pathname), {});

    this._state = { status: 'not_found' };
    this._error = new NotFoundError();
  }

  protected _load(
    _dataLoader: (options: DataLoaderOptions<{}, any>) => PromiseLike<void> | void
  ): AbortablePromise<void> {
    return new AbortablePromise(resolve => resolve(undefined));
  }
}
