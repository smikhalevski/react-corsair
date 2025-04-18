const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: [
    './src/main/history/index.ts',
    './src/main/ssr/node/index.ts',
    './src/main/ssr/index.ts',
    './src/main/index.ts',
  ],
  output: [
    { format: 'cjs', entryFileNames: '[name].js', dir: './lib', preserveModules: true },
    { format: 'es', entryFileNames: '[name].mjs', dir: './lib', preserveModules: true },
  ],
  plugins: [typescript({ tsconfig: './tsconfig.build.json' })],
  external: ['fast-deep-equal', 'parallel-universe', 'react', 'stream'],
};
