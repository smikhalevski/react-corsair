declare global {
  interface Window {
    __REACT_CORSAIR_SSR_STATE__?: { set(presenterIndex: number, stateStr: string): void };
  }
}

export {};
