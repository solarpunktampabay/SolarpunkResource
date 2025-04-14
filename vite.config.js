import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [
    react({
      // This ensures JSX is processed in .js files
      include: "**/*.{jsx,js}",
    }),
    nodePolyfills({
      // Whether to polyfill specific globals
      globals: {
        process: true,
        Buffer: true,
      },
      // Whether to polyfill `node:` protocol imports
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      'process': 'process/browser',
      'stream': 'stream-browserify',
      'crypto': 'crypto-browserify',
      'buffer': 'buffer/',
      'util': 'util/',
      'assert': 'assert/',
      'http': 'stream-http',
      'https': 'https-browserify',
      'os': 'os-browserify/browser',
      'url': 'url/',
      'path': 'path-browserify',
      'querystring': 'querystring-es3',
      'zlib': 'browserify-zlib'
    }
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(process.version),
    'process.stdout': JSON.stringify(null),
    'process.stderr': JSON.stringify(null),
    'process.stdin': JSON.stringify(null),
    'process.isTTY': JSON.stringify(false)
  },
  optimizeDeps: {
    exclude: [
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  }
}); 