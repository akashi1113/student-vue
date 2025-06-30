const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
})

// vue.config.js
const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        // 根据需求设置标志值，这里设为 false 关闭相关检查
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
      })
    ]
  },
  devServer: {
    host: "localhost", //指定使用一个 host。默认是 localhost，这里默认值即可
    port: 5173, //指定端口
    // hot: true, // 开启热更新
    https: false, // 是否开启https模式
    proxy: { // 请求代理服务器
        '/': { //带上api前缀的
            target: 'http://localhost:8080/', //代理目标地址
            changeOrigin: true,
            secure: false,
            ws: false,
            pathRewrite: {
                // 在发出请求后将/api替换为''空值，这样不影响接口请求
                // '^/springbootsu39z': ''
            }
        },
        '/api':{
            target: 'http://localhost:8080',
            changeOrigin: true,
            pathRewrite: {
                '^/api':''}
        }
    },
    webSocketServer: false,  // !!!!! 关键
  },
};