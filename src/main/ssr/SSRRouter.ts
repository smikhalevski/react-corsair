import { RouterOptions, To } from '../types';
import { Router } from '../Router';
import { RouteController, RouteState } from '../RouteController';
import { toLocation } from '../utils';
import { matchRoutes } from '../matchRoutes';
import { reconcileControllers } from '../reconcileControllers';

/**
 * Options provided to the {@link SSRRouter} constructor.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group SSR
 */
export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  /**
   * Stringifies a route state before it is sent to the client.
   *
   * @param state The route state to stringify.
   * @default JSON.stringify
   */
  stateStringifier?: (state: RouteState) => string;

  /**
   * A nonce string to allow scripts for
   * [`script-src` Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src).
   */
  nonce?: string;
}

/**
 * The base implementation of a router that supports client hydration after SSR.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group SSR
 */
export class SSRRouter<Context = any> extends Router<Context> {
  /**
   * Map from a controller instance to its latest state that was sent to the client for hydration.
   */
  protected _hydratedStates = new WeakMap<RouteController, RouteState>();

  /**
   * Stringifies the state of the controller before sending it to the client.
   */
  protected _stateStringifier;

  /**
   * A nonce string to allow scripts for
   * [`script-src` Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src).
   */
  nonce;

  /**
   * Creates a new instance of an {@link SSRRouter}.
   *
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: SSRRouterOptions<Context>) {
    const { stateStringifier = JSON.stringify } = options;

    super(options);

    this._stateStringifier = stateStringifier;

    this.nonce = options.nonce;
  }

  /**
   * Resolves with `true` if there were pending controllers and their state has changed after they became
   * non-pending. Otherwise, resolves with `false`.
   */
  hasChanges(): Promise<boolean> {
    const promises = [];

    for (let controller = this.rootController; controller !== null; controller = controller.childController) {
      promises.push(controller.promise);
    }

    return Promise.all(promises).then(() => {
      for (let controller = this.rootController; controller !== null; controller = controller.childController) {
        if (this._hydratedStates.get(controller) !== controller.state) {
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
      let controller = this.rootController, index = 0;
      controller !== null;
      controller = controller.childController, index++
    ) {
      if (this._hydratedStates.get(controller) === controller.state) {
        continue;
      }

      this._hydratedStates.set(controller, controller.state);

      if (script === '') {
        script = 'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();';
      }

      script +=
        's.set(' +
        index +
        ',' +
        JSON.stringify(this._stateStringifier(controller.state)).replace(/</g, '\\u003C') +
        ');';
    }

    if (script !== '') {
      script += 'var e=document.currentScript;e&&e.parentNode.removeChild(e);';
    }

    return script;
  }
}
