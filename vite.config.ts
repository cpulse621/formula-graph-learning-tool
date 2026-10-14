/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 静的サイトとして、どこに置いても動くようにする
  test: { environment: 'node', exclude: ['e2e/**', 'node_modules/**'] },
})
