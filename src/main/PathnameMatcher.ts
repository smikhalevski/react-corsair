import { Location, LocationMatch, LocationMatcher, LocationOptions } from './types';

export class PathnameMatcher implements LocationMatcher<void, any> {
  readonly hasSuccessivePathname;

  protected readonly _pathname;

  constructor(
    public readonly pathname: string,
    public isCaseSensitive = false
  ) {
    this._pathname = isCaseSensitive ? pathname : pathname.toLowerCase();
    this.hasSuccessivePathname = pathname.length > 2 && pathname.endsWith('/*');

    if (this.hasSuccessivePathname) {
      this.pathname = this.pathname.slice(0, -2);
    }
  }

  matchLocation(location: Location, _context: any): LocationMatch<void> | null {
    const pathname = this.isCaseSensitive ? location.pathname : location.pathname.toLowerCase();

    if (
      pathname === this._pathname ||
      (this.hasSuccessivePathname && pathname.startsWith(this._pathname) && pathname[this._pathname.length] === '/')
    ) {
      return {
        pathname: this.pathname,
        successivePathname: this.hasSuccessivePathname ? pathname.substring(0, this.pathname.length) : undefined,
        params: undefined,
        hash: location.hash,
        state: location.state,
      };
    }

    return null;
  }

  createLocation(options: LocationOptions<void>, _context: any): Location {
    return {
      pathname: this.pathname,
      search: '',
      hash: options.hash || '',
      state: options.state,
    };
  }
}
