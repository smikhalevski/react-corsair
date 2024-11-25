import { RouterOptions } from '../__types';
import { OutletPayload } from '../OutletModel';
import { Router } from '../Router';

export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  stateStringifier?: (payload: OutletPayload) => string;
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
