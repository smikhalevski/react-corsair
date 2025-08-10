/**
 * NodeJS-specific tooling for SSR implementation that supports router hydration on the client.
 *
 * ```ts
 * import { createHydrationStream } from 'react-corsair/ssr/node';
 * ```
 *
 * @module ssr/node
 */

export { createHydrationStream } from './createHydrationStream.js';
