declare global {
  interface Window {
    /**
     * A mapping from a router ID to a Map from a matched route index to a corresponding SSR state.
     */
    __REACT_CORSAIR_SSR_STATE__?: {
      [routerId: string]: {
        set(routeIndex: number, stateStr: string): void;
      };
    };
  }
}

export {};
