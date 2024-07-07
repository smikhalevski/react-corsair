/**
 * Throws {@link NotFoundError} that causes the closest {@link Router} to render the
 * {@link RouterProps.notFoundFallback}.
 *
 * @param message The optional message of the {@link NotFoundError}.
 */
export function notFound(message?: string): never {
  throw new NotFoundError(message);
}

/**
 * The errors that should be thrown during rendering to signify that the {@link RouterProps.notFoundFallback}
 * must be rendered instead of the matched route.
 */
export class NotFoundError extends Error {}

NotFoundError.prototype.name = 'NotFoundError';
