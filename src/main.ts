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

let redirectingToLogin = false
window.addEventListener('api:unauthorized', () => {
  if (redirectingToLogin) return
  redirectingToLogin = true
  setTimeout(() => { redirectingToLogin = false }, 1000)

  if (adminAuth.token) {
    adminAuth.clearSession()
    router.push('/admin/login')
  } else {
    auth.clearSession()
    router.push('/login')
  }
})

app.mount('#app')
