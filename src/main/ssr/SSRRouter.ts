import { RouterOptions } from '../types';
import { Router } from '../Router';
import { RoutePresenterState } from '../RoutePresenter';

export interface SSRRouterOptions<Context> extends RouterOptions<Context> {
  stateStringifier?: (payload: RoutePresenterState) => string;
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
