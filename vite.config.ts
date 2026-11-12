import { defineConfig } from 'vite'
declare const process: { env: Record<string, string | undefined> }
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  server: {
    watch: {
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/audit/**', '**/shots/**', '**/source-assets/**', '**/tests/**', '**/dist/**'],
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})



