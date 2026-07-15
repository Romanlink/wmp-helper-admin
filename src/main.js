import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'

// 初始化主题：从 localStorage 读取，否则默认暗色
const savedTheme = localStorage.getItem('helper-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

const app = createApp(App)
app.use(router)
app.mount('#app')
