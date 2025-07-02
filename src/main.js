// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import axios from 'axios'
import { createPinia } from 'pinia'

// 添加邮箱登录所需的图标
// import { Message, Key } from '@element-plus/icons-vue'
// app.component('Message', Message)
// app.component('Key', Key)

// 创建Vue实例
const app = createApp(App)

// 注册Element Plus图标（来自main.ts）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 配置axios（合并双方配置）
// axios.defaults.baseURL = 'http://localhost:8081'  // 来自main.js
// axios.defaults.withCredentials = true           // 来自main.ts

// 全局API挂载（注释掉的代码保持原样）
// app.config.globalProperties.$api = {
//     exam: require('./api/exam').default,
//     question: require('./api/question').default,
//     homework: require('./api/homework').default,
// }

// 使用插件（合并双方）
app.use(router)
app.use(ElementPlus)
app.use(createPinia())  // 来自main.ts

// 挂载应用
app.mount('#app')
