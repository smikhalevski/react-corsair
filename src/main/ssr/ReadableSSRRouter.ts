import { SSRRouter, SSRRouterOptions } from './SSRRouter';

/**
 * The streaming router that can be used as a transformer for
 * [Web Streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API). It enqueues router hydration chunks
 * into the after each chunk from the read side.
 *
 * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
 * @group SSR
 */
export class ReadableSSRRouter<Context = any> extends SSRRouter<Context> implements ReadableWritablePair {
  readonly readable: ReadableStream;
  readonly writable: WritableStream;

  /**
   * Creates a new {@link ReadableSSRRouter} instance.
   *
   * @param options Router options.
   * @template Context A context provided to {@link react-corsair!RouteOptions.dataLoader route data loaders}.
   */
  constructor(options: SSRRouterOptions<Context>) {
    super(options);

    const transformer = new TransformStream({
      transform: (chunk, presenter) => {
        presenter.enqueue(chunk);

        if (!chunk.toString().endsWith('</script>')) {
          return;
        }

        const hydrationChunk = this.nextHydrationChunk();

        if (hydrationChunk !== '') {
          presenter.enqueue(hydrationChunk);
        }
      },
    });

    this.readable = transformer.readable;
    this.writable = transformer.writable;
  }
}
