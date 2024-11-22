import { RoutePayload } from '../loadRoute';
import { RouterOptions } from '../types';
import { Router } from '../Router';

export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  stateStringifier?: (state: RoutePayload) => string;
  nonce?: string;
}

export class SSRRouter<Context = any> extends Router<Context> {
  hasChanges(): Promise<boolean> {
    return Promise.resolve(false);
  }

  nextHydrationChunk(): string {
    return '';
  }
}
