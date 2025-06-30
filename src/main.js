import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8080'

const app = createApp(App)

app.config.globalProperties.$api = {
    exam: require('./api/exam').default,
    question: require('./api/question').default,
    homework: require('./api/homework').default,
}

app.use(router).mount('#app')