declare global {
  interface Window {
    __REACT_CORSAIR_SSR_STATE__?: {
      /**
       * Updates state of an individual route presenter during SSR.
       *
       * @param index The index of the updated presenter, where 0 is the {@link Router.rootPresenter}.
       * @param stateStr The serialized route presenter state.
       */
      set(index: number, stateStr: string): void;
    };
  }
}

export {};
