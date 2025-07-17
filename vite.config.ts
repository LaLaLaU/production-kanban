import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // SQLite.js 配置
  optimizeDeps: {
    exclude: ['sql.js'] // sql.js需要特殊处理
  },

  // 处理sql.js的特殊配置
  worker: {
    format: 'es'
  },

  // 静态资源配置
  assetsInclude: ['**/*.wasm'],

  // 确保WASM文件的正确MIME类型
  define: {
    global: 'globalThis',
  },

  // 开发服务器配置
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 3000,
    fs: {
      // 允许访问项目根目录外的文件
      allow: ['..']
    }
  },

  // 构建配置
  build: {
    // 确保WASM文件被正确处理
    assetsInlineLimit: 0, // 禁用小文件内联，保持WASM文件独立
    rollupOptions: {
      output: {
        // 确保WASM文件在正确的位置
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'sql.js-wasm/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        // 修改入口文件格式，支持传统脚本加载
        entryFileNames: 'assets/[name]-[hash].js',
        format: 'iife', // 使用立即执行函数，支持file://协议
        name: 'ProductionKanban' // 全局变量名
      }
    },
    // 目标浏览器配置，确保现代浏览器兼容性
    target: ['es2018', 'chrome58', 'firefox57', 'safari11'],
    // 确保兼容性的额外配置
    minify: 'esbuild'
  },

  // 便携部署配置
  base: './', // 使用相对路径，支持文件系统访问

  // 预览服务器配置（用于生产环境测试）
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})
