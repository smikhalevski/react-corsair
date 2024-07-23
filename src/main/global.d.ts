declare global {
  interface Window {
    /**
     * A map from a route match index to a serialized SSR payload.
     */
    __REACT_CORSAIR_SSR_PAYLOADS__?: {
      set(index: number, payloadStr: string): void;
    };
  }
}

export {};
