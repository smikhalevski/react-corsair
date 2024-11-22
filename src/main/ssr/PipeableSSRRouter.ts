import { Writable } from 'stream';
import { SSRRouter, SSRRouterOptions } from './SSRRouter';

export class PipeableSSRRouter<Context> extends SSRRouter<Context> {
  readonly stream: NodeJS.WritableStream;

  constructor(stream: NodeJS.WritableStream, options: SSRRouterOptions<Context>) {
    super(options);

    this.stream = new Writable({
      write: (chunk, encoding, callback) => {
        stream.write(chunk, encoding, error => {
          if (error) {
            callback(error);
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
