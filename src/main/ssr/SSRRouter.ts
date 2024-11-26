import { OutletState, RouterOptions } from '../__types';
import { Router } from '../Router';

export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  stateStringifier?: (payload: OutletState) => string;
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
