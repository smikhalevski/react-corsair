import { Writable } from 'node:stream';
import { SSRRouter, SSRRouterOptions } from '../SSRRouter.js';

/**
 * Streaming router for NodeJS environment.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group Server-Side Rendering
 */
export class PipeableSSRRouter<Context> extends SSRRouter<Context> {
  /**
   * The stream that includes both React rendering chunks and controller hydration chunks.
   */
  readonly stream: NodeJS.WritableStream;

  /**
   * Creates a new {@link PipeableSSRRouter} instance.
   *
   * @param stream The output stream to which both React chunks and controller hydration chunks are written.
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(stream: NodeJS.WritableStream, options: SSRRouterOptions<Context>) {
    super(options);

    this.stream = new Writable({
      write: (chunk, encoding, callback) => {
        stream.write(chunk, encoding, error => {
          if (error) {
            callback(error);
            return;
          }

          if (!chunk.toString().endsWith('</script>')) {
            callback();
            return;
          }

          const hydrationChunk = this.nextHydrationChunk();

          if (hydrationChunk !== '') {
            stream.write(hydrationChunk, callback);
            return;
          }

          callback();
        });
      },

      final: callback => {
        stream.end(callback);
      },
    });
  }
}
