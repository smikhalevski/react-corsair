export function notFound(message?: string): never {
  throw new NotFoundError(message);
}

export class NotFoundError extends Error {}

NotFoundError.prototype.name = 'NotFoundError';
