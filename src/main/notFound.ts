/**
 * Triggers the closest router to render {@link RouterProps.notFoundComponent}.
 */
export function notFound(): never {
  throw new NotFound();
}

export class NotFound {}
