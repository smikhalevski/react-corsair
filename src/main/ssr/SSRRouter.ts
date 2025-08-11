import { RouterOptions, RouteState, Serializer } from '../types.js';
import { Router } from '../Router.js';
import { RouteController } from '../RouteController.js';

/**
 * Options provided to the {@link SSRRouter} constructor.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group Server-Side Rendering
 */
export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  /**
   * Stringifies a route state before it is sent to the client.
   *
   * @default JSON
   */
  serializer?: Serializer;

  /**
   * A nonce string to allow hydration scripts under a
   * [`script-src` Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src).
   */
  nonce?: string;
}

/**
 * The base implementation of a router that supports client hydration after SSR.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group Server-Side Rendering
 */
export class SSRRouter<Context = any> extends Router<Context> {
  /**
   * Map from a controller instance to its latest state that was sent to the client for hydration.
   */
  protected _hydratedStates = new WeakMap<RouteController, RouteState>();

  /**
   * Stringifies the state of the controller before sending it to the client.
   */
  protected _serializer;

  readonly isSSR: boolean = true;

  /**
   * A nonce string to allow hydration scripts under a
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
    const { serializer = JSON } = options;

    super(options);

    this._serializer = serializer;

    this.nonce = options.nonce;
  }

  /**
   * Resolves with `true` if the {@link nextHydrationChunk} is non-empty.
   */
  hasChanges(): Promise<boolean> {
    const promises = [];

    for (
      let controller: RouteController | null = this.rootController;
      controller !== null;
      controller = controller.childController
    ) {
      promises.push(controller.promise);
    }

    return Promise.all(promises).then(() => {
      for (
        let controller: RouteController | null = this.rootController;
        controller !== null;
        controller = controller.childController
      ) {
        if (this._hydratedStates.get(controller) !== controller['_state']) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Returns an inline `<script>` tag with source that hydrates the client with the state accumulated during SSR,
   * or an empty string if there are no state changes since the last time {@link nextHydrationChunk} was called.
   */
  nextHydrationChunk(): string {
    const source = this.nextHydrationScriptSource();

    if (source === '') {
      return source;
    }

    return (this.nonce === undefined ? '<script>' : '<script nonce="' + this.nonce + '">') + source + '</script>';
  }

  /**
   * Returns a script source that hydrates the client with the state accumulated during SSR, or an empty string if there
   * are no state changes since the last time {@link nextHydrationScriptSource} was called.
   */
  nextHydrationScriptSource(): string {
    let source = '';

    for (
      let controller: RouteController | null = this.rootController, index = 0;
      controller !== null;
      controller = controller.childController, index++
    ) {
      if (this._hydratedStates.get(controller) === controller['_state']) {
        continue;
      }

      this._hydratedStates.set(controller, controller['_state']);

      if (source === '') {
        source = 'var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();';
      }

      const json = JSON.stringify(this._serializer.stringify(controller['_state'])).replace(/</g, '\\u003C');

      source += 's.set(' + index + ',' + json + ');';
    }

    if (source !== '') {
      source += 'var e=document.currentScript;e&&e.parentNode.removeChild(e);';
    }

    return source;
  }

  /**
   * Instantly aborts the pending route loading for the {@link react-corsair!Router.rootController rootController} and its
   * descendants.
   *
   * @param reason The abort reason that is used for rejection of the loading promise.
   */
  abort(reason?: unknown): void {
    for (
      let controller: RouteController | null = this.rootController;
      controller !== null;
      controller = controller.childController
    ) {
      controller.abort(reason);
    }
  }
}
