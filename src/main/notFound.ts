/**
 * Throws {@link NotFoundError} that causes an enclosing {@link Outlet} to render a
 * {@link RouteOptions.notFoundComponent}.
 *
 * @param message An optional message of a {@link NotFoundError}.
 * @group Routing
 */
export function notFound(message?: string): never {
  throw new NotFoundError(message);
}

/**
 * An error that is thrown during rendering to signify that the {@link RouteOptions.notFoundComponent} must be rendered
 * instead of the matched route.
 *
 * Use {@link notFound} to create a {@link NotFoundError} instance.
 * @group Routing
 */
export class NotFoundError extends Error {}

NotFoundError.prototype.name = 'NotFoundError';
