declare global {
  interface Window {
    __REACT_CORSAIR_SSR_STATE__?: {
      /**
       * Updates state of an individual controller during SSR.
       *
       * @param index The index of the updated controller, where 0 is the {@link Router.rootController}.
       * @param stateStr The serialized route state.
       */
      set(index: number, stateStr: string): void;
    };
  }
}

export {};
