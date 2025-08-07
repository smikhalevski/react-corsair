import { SSRRouter, SSRRouterOptions } from '../SSRRouter.js';
import { Transform } from 'node:stream';
import { enqueueHydrationChunk, flushHydrationChunk } from '../utils.js';

/**
 * Streaming router for NodeJS environment.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group Server-Side Rendering
 */
export class NodeSSRRouter<Context> extends SSRRouter<Context> {
  readonly stream: NodeJS.ReadWriteStream;

  /**
   * Creates a new {@link NodeSSRRouter} instance.
   *
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: SSRRouterOptions<Context>) {
    super(options);

    let prevHydrationChunk: Uint8Array | null = null;

    this.stream = new Transform({
      transform: (reactChunk, _encoding, callback) => {
        prevHydrationChunk = enqueueHydrationChunk(reactChunk, prevHydrationChunk, this.nextHydrationChunk(), chunk =>
          callback(null, chunk)
        );
      },

      flush: callback => {
        flushHydrationChunk(prevHydrationChunk, this.nextHydrationChunk(), chunk => callback(null, chunk));
      },
    });
  }
}
