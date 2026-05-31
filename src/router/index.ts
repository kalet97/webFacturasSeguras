import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/splash' },
    { path: '/splash', name: 'splash', component: () => import('@/views/SplashView.vue'), meta: { public: true } },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/recibos/add', name: 'add-recibo', component: () => import('@/views/AddReciboView.vue') },
    { path: '/recibos/:id', name: 'recibo-detail', component: () => import('@/views/ReciboDetailView.vue') },
    { path: '/recibos/:id/payment', name: 'request-payment', component: () => import('@/views/RequestPaymentView.vue') },
    { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
    { path: '/profile/edit', name: 'edit-profile', component: () => import('@/views/EditProfileView.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
