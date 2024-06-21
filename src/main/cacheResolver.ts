import type { Resolver } from './types';
import { isPromiseLike } from './utils';

/**
 * Caches the non-`undefined` result returned from the resolver.
 *
 * @param resolver The resolver to cache.
 */
export function cacheResolver(resolver: Resolver<unknown, unknown>): Resolver<unknown, unknown> {
  let cachedResult: unknown;

  return params => {
    if (cachedResult !== undefined || ((cachedResult = resolver(params)), !isPromiseLike(cachedResult))) {
      return cachedResult;
    }

    cachedResult = cachedResult.then(
      result => (cachedResult = result),
      error => {
        cachedResult = undefined;
        throw error;
      }
    );
    return cachedResult;
  };
}
