/**
 * An symbol that is thrown during rendering to signify that
 * the {@link RouteOptions.notFoundComponent notFoundComponent} must be rendered instead of the matched route component.
 *
 * @see {@link notFound}
 * @group Routing
 */
export const NOT_FOUND = Symbol.for('ReactCorsair.notFound');

/**
 * Throws an error that causes an enclosing {@link Outlet} to render a
 * {@link RouteOptions.notFoundComponent notFoundComponent}.
 *
 * @group Routing
 */
export function notFound(): never {
  throw NOT_FOUND;
}
