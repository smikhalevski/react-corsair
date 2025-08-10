/**
 * Tooling for SSR implementation that supports router hydration on the client.
 *
 * ```ts
 * import { createHydrationStream } from 'react-corsair/ssr';
 * ```
 *
 * @module ssr
 */

export { SSRRouter, type SSRRouterOptions } from './SSRRouter.js';
export { createHydrationStream } from './createHydrationStream.js';
export { injectHydrationChunk } from './injectHydrationChunk.js';
