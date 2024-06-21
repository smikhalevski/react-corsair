import { URLPattern } from 'urlpattern-polyfill';
import type { PathnameMatcher } from './types';

/**
 * Infers pathname matcher from URL pattern.
 *
 * @param pattern The pathname pattern with {@link !URLPattern} syntax that the created composer would use to build URLs
 * upon.
 * @param isSlashSensitive If `true` then pathname leading and trailing slashes must strictly match the pattern.
 */
export function inferPathnameMatcher(pattern: string, isSlashSensitive = false): PathnameMatcher {
  const urlPattern = new URLPattern({ pathname: pattern });
  const isIntermediate = pattern[pattern.length - 1] === '*';

  const a0 = pattern[0] === '/';
  const b0 = pattern[pattern.length - 1] === '/';

  return pathname => {
    let match = urlPattern.exec({ pathname });

    if (match === null && !isSlashSensitive) {
      const a1 = pathname.length !== 0 && pathname[0] === '/';
      const b1 = pathname.length !== 0 && pathname[pathname.length - 1] === '/';

      if (a0 !== a1 || b0 !== b1) {
        pathname = a0 && !a1 ? '/' + pathname : !a0 && a1 ? pathname.substring(1) : pathname;
        pathname = b0 && !b1 ? pathname + '/' : !b0 && b1 ? pathname.slice(0, -1) : pathname;

        match = urlPattern.exec({ pathname });
      }
    }

    if (match === null) {
      return;
    }

    const params = match.pathname.groups;

    if (isIntermediate) {
      let param;
      for (let i = 0; params[i] !== undefined; ++i) {
        param = params[i];
      }
      pathname = pathname.substring(0, pathname.length - param!.length);
    }

    return { pathname, params };
  };
}
