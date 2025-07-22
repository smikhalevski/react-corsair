/**
 * Throws an error that causes an enclosing {@link Outlet} to render a
 * {@link RouteOptions.notFoundComponent notFoundComponent}.
 *
 * @group Routing
 */
export function notFound(): never {
  throw new NotFoundError();
}

/**
 * An error that is thrown during rendering to signify that the {@link RouteOptions.notFoundComponent notFoundComponent}
 * must be rendered instead of the matched route component.
 *
 * @group Routing
 */
export class NotFoundError extends Error {
  /**
   * Creates a new {@link NotFoundError} instance.
   */
  constructor() {
    super();
  }
}

/**
 * @internal
 */
NotFoundError.prototype.name = 'NotFoundError';
