import { createApp } from 'vue'
import App from './app.vue'
import i18n from './i18n'
import './index.css'

// 创建并挂载应用
const app = createApp(App)
app.use(i18n)
app.mount('#app')