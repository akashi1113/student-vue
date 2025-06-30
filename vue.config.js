const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    host: "localhost",
    port: 5173,
    https: false,
    proxy: {
      '/': {
        target: 'http://localhost:8080/',
        changeOrigin: true,
        secure: false,
        ws: false,
        pathRewrite: {
          // '^/springbootsu39z': ''
        }
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    webSocketServer: false,
  }
});
