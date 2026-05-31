import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

import { useAuthStore } from './stores/auth'
import { useAdminAuthStore } from './stores/adminAuth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore()
auth.restoreSession()

const adminAuth = useAdminAuthStore()
adminAuth.restoreSession()

app.mount('#app')
