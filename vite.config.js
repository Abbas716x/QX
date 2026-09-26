import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';

// Custom Vite Rollup plugin for production obfuscation
function obfuscatorPlugin() {
  return {
    name: 'vite-plugin-production-obfuscator',
    enforce: 'post',
    apply: 'build',
    renderChunk(code, chunk) {
      if (chunk.fileName.endsWith('.js')) {
        try {
          const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: true,
            debugProtectionInterval: 4000,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: true,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.8,
            transformObjectKeys: true,
            unicodeEscapeSequence: false
          });
          return {
            code: obfuscationResult.getObfuscatedCode(),
            map: null
          };
        } catch (err) {
          console.warn('[Obfuscator] Failed to obfuscate chunk:', chunk.fileName, err);
          return null;
        }
      }
      return null;
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    obfuscatorPlugin()
  ],
  server: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1200
  }
});
