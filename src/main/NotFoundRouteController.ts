import { AbortablePromise } from 'parallel-universe';
import { Route } from './Route.js';
import { RouteController } from './RouteController.js';
import { Router } from './Router.js';
import { DataLoaderOptions } from './types.js';
import { NotFoundError } from './notFound.js';
import { encodePathname } from './PathnameTemplate.js';

/**
 * A special-case controller that is user when no route was matched by a router.
 *
 * This controller creates a route that matches the provided pathname.
 */
export class NotFoundRouteController extends RouteController<{}, void> {
  constructor(router: Router, pathname: string) {
    super(router, new NotFoundRoute(pathname), {});

    this._state = { status: 'not_found' };
    this._error = new NotFoundError();
  }

  protected _load(
    _dataLoader: (options: DataLoaderOptions<{}, any>) => PromiseLike<void> | void
  ): AbortablePromise<void> {
    return new AbortablePromise(resolve => {
      this._state = { status: 'not_found' };
      this._error = new NotFoundError();
      this._publish({ type: 'not_found', controller: this });

      resolve();
    });
  }
}

/**
 * A route exposed by a {@link NotFoundRouteController}.
 */
class NotFoundRoute extends Route {
  constructor(pathname: string) {
    super(null, { pathname: encodePathname(pathname), isCaseSensitive: true, component: NotFound });
  }
}

function NotFound(): never {
  throw new Error('The component of a NotFoundRoute must not be rendered');
}
