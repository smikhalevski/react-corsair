import { SSRRouter, SSRRouterOptions } from './SSRRouter.js';
import { enqueueHydrationChunk, flushHydrationChunk } from './utils.js';

/**
 * The streaming router that can be used as a transformer for
 * [Web Streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API). It enqueues router hydration chunks
 * into the after each chunk from the read side.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group Server-Side Rendering
 */
export class WebSSRRouter<Context = any> extends SSRRouter<Context> {
  readonly stream: ReadableWritablePair<Uint8Array, Uint8Array>;

  /**
   * Creates a new {@link WebSSRRouter} instance.
   *
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: SSRRouterOptions<Context>) {
    super(options);

    let prevHydrationChunk: Uint8Array | null = null;

    this.stream = new TransformStream({
      transform: (reactChunk, controller) => {
        prevHydrationChunk = enqueueHydrationChunk(reactChunk, prevHydrationChunk, this.nextHydrationChunk(), chunk =>
          controller.enqueue(chunk)
        );
      },

      flush: controller => {
        flushHydrationChunk(prevHydrationChunk, this.nextHydrationChunk(), chunk => controller.enqueue(chunk));
      },
    });
  }
}
