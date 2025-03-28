import { RouterOptions } from '../__types';
import { Router } from '../__Router';
import { RoutePresenter, RoutePresenterState } from '../RoutePresenter';

export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  stateStringifier?: (payload: RoutePresenterState) => string;
  nonce?: string;
}

export class SSRRouter<Context = any> extends Router<Context> {
  /**
   * Map from an route presenter instance to its latest state that was sent to the client for hydration.
   */
  protected _hydratedPresenterStates = new WeakMap<RoutePresenter, RoutePresenterState>();

  /**
   * Stringifies the state of the route presenter before sending it to the client.
   */
  protected _stateStringifier;

  /**
   * A nonce string to allow scripts for
   * [`script-src` Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src).
   */
  nonce;

  constructor(options: SSRRouterOptions<Context>) {
    const { stateStringifier = JSON.stringify } = options;

    super(options);

    this._stateStringifier = stateStringifier;

    this.nonce = options.nonce;
  }

  /**
   * Resolves with `true` if there were pending route presenters and their state has changed after they became
   * non-pending. Otherwise, resolves with `false`.
   */
  hasChanges(): Promise<boolean> {
    const promises = [];

    for (let presenter = this.rootPresenter; presenter !== null; presenter = presenter.childPresenter) {
      promises.push(presenter.pendingPromise);
    }

    return Promise.all(promises).then(() => {
      for (let presenter = this.rootPresenter; presenter !== null; presenter = presenter.childPresenter) {
        if (this._hydratedPresenterStates.get(presenter) !== presenter.state) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Returns an inline `<script>` tag with source that hydrates the client with the state accumulated during SSR,
   * or an empty string if there are no state changes since the last time {@link nextHydrationScript} was called.
   */
  nextHydrationChunk(): string {
    const source = this.nextHydrationScript();

    if (source === '') {
      return source;
    }

    return (this.nonce === undefined ? '<script>' : '<script nonce="' + this.nonce + '">') + source + '</script>';
  }

  /**
   * Returns a script source that hydrates the client with the state accumulated during SSR, or an empty string if there
   * are no state changes since the last time {@link nextHydrationScript} was called.
   */
  nextHydrationScript(): string {
    let script = '';

    for (
      let presenter = this.rootPresenter, presenterIndex = 0;
      presenter !== null;
      presenter = presenter.childPresenter, presenterIndex++
    ) {
      if (this._hydratedPresenterStates.get(presenter) === presenter.state) {
        continue;
      }

      this._hydratedPresenterStates.set(presenter, presenter.state);

      if (script === '') {
        script = '(function(){var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();';
      }

      script +=
        's.set(' +
        presenterIndex +
        ',' +
        JSON.stringify(this._stateStringifier(presenter.state)).replace(/</g, '\\u003C') +
        ');';
    }

    if (script !== '') {
      script += 'var e=document.currentScript;e&&e.parentNode.removeChild(e);})();';
    }

    return script;
  }
}
