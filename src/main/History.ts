export interface History {
  /**
   * The current URL.
   */
  readonly url: URL;

  /**
   * The current state stored in the history.
   */
  readonly state: any;

  back(): void;

  pushState(url: string | URL, state: any): void;

  replaceState(url: string | URL, state: any): void;

  subscribe(listener: () => void): () => void;
}
