import type { RawParams, URLComposer } from './types';

/**
 * Creates a composer that builds a URL by injecting params into a pathname pattern, and serializing the rest of params
 * as a search string.
 *
 * @param pattern The pathname pattern with {@link !URLPattern} syntax that the created composer would use to build URLs
 * upon.
 */
export function inferURLComposer(pattern: string): URLComposer<any> {
  if (!/^[^*{(]*\**$/.test(pattern)) {
    throw new Error(
      'Cannot infer urlComposer from a pathname that contains non-capturing groups, RegExp groups, or non-trailing wildcards. The urlComposer option is required.'
    );
  }

  pattern = pattern.replace(/\*+$/, '').replace(/\/$/, '');

  if (pattern.length !== 0 && pattern[0] !== '/') {
    pattern = '/' + pattern;
  }

  return (base, params, fragment, searchParamsParser) => {
    let pathname = pattern;
    let search = '';

    if (params !== undefined) {
      const searchParams: RawParams = {};

      for (const name of Object.keys(params).sort(compareLengthDescending)) {
        const value = params[name];

        if (value === null || value === undefined) {
          continue;
        }
        if (pathname === (pathname = pathname.replace(':' + name, encodeURIComponent(value)))) {
          searchParams[name] = value;
        }
      }

      if (pathname.indexOf(':') !== -1) {
        throw new Error('Pathname params are missing: ' + /:[\w$]+/g.exec(pathname));
      }

      search = searchParamsParser.stringify(searchParams);
    }

    if (pattern.length !== 0 && base.length !== 0 && base[base.length - 1] === '/') {
      base = base.slice(0, -1);
    }

    search = search.length === 0 || search === '?' ? '' : search[0] === '?' ? search : '?' + search;

    fragment =
      fragment === undefined || fragment.length === 0 || fragment === '#'
        ? ''
        : fragment[0] === '#'
          ? fragment
          : '#' + encodeURIComponent(fragment);

    return base + pathname + search + fragment;
  };
}

function compareLengthDescending(a: string, b: string): number {
  return b.length - a.length;
}
