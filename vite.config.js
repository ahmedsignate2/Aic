// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'miniapp',
  build: {
    outDir: '../dist_miniapp'
  }
})
