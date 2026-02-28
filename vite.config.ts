/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    // 构建完成后将 preload.js 复制到 dist 目录
    {
      name: 'copy-preload',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'preload.cjs'),
            resolve(__dirname, 'dist/preload.js')
          )
          console.log('[vite] 已复制 preload.cjs 到 dist/preload.js')
        } catch (e) {
          console.warn('[vite] 复制 preload.cjs 失败:', e)
        }
      },
    },
  ],
  // uTools 插件从本地文件系统加载，资源路径必须使用相对路径
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
