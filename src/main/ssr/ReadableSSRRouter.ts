import { SSRRouter, SSRRouterOptions } from './SSRRouter';

export class ReadableSSRRouter<Context = any> extends SSRRouter<Context> implements ReadableWritablePair {
  readonly readable: ReadableStream;
  readonly writable: WritableStream;

  constructor(options: SSRRouterOptions<Context>) {
    super(options);

    const transformer = new TransformStream({
      transform: (chunk, controller) => {
        controller.enqueue(chunk);

        const hydrationChunk = this.nextHydrationChunk();

        if (hydrationChunk !== '') {
          controller.enqueue(hydrationChunk);
        }
      },
    });

    this.readable = transformer.readable;
    this.writable = transformer.writable;
  }
}
