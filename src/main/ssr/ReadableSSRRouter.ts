import { SSRRouter, SSRRouterOptions } from './SSRRouter';

/**
 * The streaming router that can be used as a transformer for
 * [Web Streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API). It enqueues executor hydration chunks
 * into the after each chunk from the read side.
 */
export class ReadableSSRRouter<Context = any> extends SSRRouter<Context> implements ReadableWritablePair {
  readonly readable: ReadableStream;
  readonly writable: WritableStream;

  /**
   * Creates a new {@link ReadableSSRRouter} instance.
   *
   * @param options Router options.
   */
  constructor(options: SSRRouterOptions<Context>) {
    super(options);

    const transformer = new TransformStream({
      transform: (chunk, presenter) => {
        presenter.enqueue(chunk);

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
