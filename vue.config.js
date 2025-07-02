const { defineConfig } = require('@vue/cli-service')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    host: "localhost",
    port: 5173,
    // https: false,
    proxy: {
      // '/': {
      //   target: 'http://localhost:8080/',
      //   changeOrigin: true,
      //   secure: false,
      //   ws: false,
      //   pathRewrite: {
      //     // '^/springbootsu39z': ''
      //   }
      // },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        },
        secure: false
      }
    },
    webSocketServer: false
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  },
  configureWebpack: {
    entry: './src/main.js',
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  }
})
