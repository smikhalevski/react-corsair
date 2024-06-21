export interface History {
  /**
   * The current URL.
   */
  readonly url: URL;

  /**
   * The current state stored in the history.
   */
  readonly state: unknown;

  /**
   * The total number of entries in history.
   */
  readonly length: number;

  push(url: URL | string): void;

  replace(url: URL | string): void;

  pushState(state: unknown, url?: URL | string): void;

  replaceState(state: unknown, url?: URL | string): void;

  go(delta: number): void;

  subscribe(listener: () => void): () => void;
}
