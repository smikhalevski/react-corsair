interface ErrorOptions {
  cause?: unknown;
}

/**
 * An error that is thrown when a {@link RouteOptions.lazyComponent lazyComponent} cannot be loaded.
 *
 * @group Routing
 */
export class LazyComponentError extends Error {
  /**
   * Creates a new {@link LazyComponentError} instance.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);

    this.cause = options?.cause;
  }
}

/**
 * @internal
 */
LazyComponentError.prototype.name = 'LazyComponentError';
