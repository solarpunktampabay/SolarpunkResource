import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react({
      // This ensures JSX is processed in .js files
      include: "**/*.{jsx,js}",
    }),
    // Rely primarily on this plugin for polyfills
    nodePolyfills({
      // You can customize options if needed, but defaults might be okay
      globals: {
        Buffer: true, // Ensure Buffer is polyfilled
        process: true, // Ensure process is polyfilled
      },
      protocolImports: true, // Polyfill node: imports
    }),
  ],
  resolve: {
    alias: {
      // Add any other non-polyfill aliases you might need here
    }
  },
  define: {
    // Add any other non-polyfill defines you might need here
    // 'process.env': {} // Keep if needed for other reasons, but likely handled
  },
  optimizeDeps: {
    esbuildOptions: {
      // Keep globalThis define if needed by other dependencies
      define: {
        global: 'globalThis'
      }
      // Removed the esbuild polyfill plugins
      // plugins: [
      //   NodeGlobalsPolyfillPlugin({
      //     process: true,
      //     buffer: true,
      //   }),
      //   NodeModulesPolyfillPlugin()
      // ]
    },
    // Removed exclusions for now, the main plugin should handle this
    // exclude: [
    //   'vite-plugin-node-polyfills/shims/buffer',
    //   'vite-plugin-node-polyfills/shims/global',
    //   'vite-plugin-node-polyfills/shims/process'
    // ],
  }
}); 