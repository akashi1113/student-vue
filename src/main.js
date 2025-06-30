import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8080'

const app = createApp(App)

// 如有需要保留全局$api
// app.config.globalProperties.$api = {
//     exam: require('./api/exam').default,
//     question: require('./api/question').default,
//     homework: require('./api/homework').default,
// }

app.use(router)
app.use(ElementPlus)
app.mount('#app')
