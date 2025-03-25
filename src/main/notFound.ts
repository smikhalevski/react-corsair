/**
 * Throws {@link NotFoundError} that causes an enclosing {@link Outlet} to render a
 * {@link RouteOptions.notFoundComponent}.
 *
 * @group Routing
 */
export function notFound(): never {
  throw new NotFoundError();
}

/**
 * An error that is thrown during rendering to signify that the {@link RouteOptions.notFoundComponent} must be rendered
 * instead of the matched route.
 *
 * Use {@link notFound} to create and throw a {@link NotFoundError} instance.
 *
 * @group Routing
 */
export class NotFoundError extends Error {}

/**
 * @internal
 */
NotFoundError.prototype.name = 'NotFoundError';
