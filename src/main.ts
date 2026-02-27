import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { setupGlobalErrorHandlers } from './utils/errorHandler'
import './styles/theme.css'
import './styles/main.css'
import './styles/responsive.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 初始化 Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

// 安装全局错误处理器（Vue 错误、Promise 拒绝、全局 JS 错误）
setupGlobalErrorHandlers(app)

// 挂载应用
app.mount('#app')
