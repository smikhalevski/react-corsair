import { RouterOptions } from '../types';
import { Router } from '../Router';
import { PresenterState } from '../Presenter';

export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  stateStringifier?: (payload: PresenterState) => string;
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
