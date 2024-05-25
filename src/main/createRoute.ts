import { URLPattern } from 'urlpattern-polyfill';
import { createPathnamePatternURLComposer } from './createPathnamePatternURLComposer';
import type { PathnameParamsParser, Route, RouteOptions } from './types';
import { isPromiseLike } from './utils';

export function createRoute<Result, Params = void>(options: RouteOptions<Result, Params>): Route<Result, Params> {
  const { pathname, searchParamsParser, paramsValidator } = options;

  let pathnameParamsParser: PathnameParamsParser;
  let urlComposer = options.urlComposer;
  let resolver = options.resolver;

  if (typeof pathname === 'string') {
    const pattern = new URLPattern(new URL(pathname, 'http://base').pathname, 'http://base');

    pathnameParamsParser = pathname => pattern.exec({ pathname })?.pathname.groups;

    urlComposer ||= createPathnamePatternURLComposer(pathname);
  } else {
    pathnameParamsParser = pathname;
  }

  if (urlComposer === undefined) {
    throw new Error('Cannot infer a urlComposer');
  }

  if (options.cacheable) {
    let cachedResult: ReturnType<typeof resolver>;
    let originalResolver = resolver;

    resolver = params => {
      if (cachedResult === undefined && ((cachedResult = originalResolver(params)), isPromiseLike(cachedResult))) {
        cachedResult.then(result => (cachedResult = result));
      }
      return cachedResult;
    };
  }

  return {
    pathnameParamsParser,
    searchParamsParser,
    resolver,
    urlComposer,
    paramsValidator,
  };
}
