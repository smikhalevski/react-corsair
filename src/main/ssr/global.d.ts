declare global {
  interface Window {
    __REACT_CORSAIR_SSR_STATE__?: {
      /**
       * Updates state of an individual controller during SSR.
       *
       * @param index The index of the updated controller, where 0 is the {@link Router.rootController}.
       * @param json The serialized route state.
       */
      set(index: number, json: string): void;
    };
  }
}

export {};
