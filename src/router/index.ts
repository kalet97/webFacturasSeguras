import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useRecibosStore } from '@/stores/recibos'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',       name: 'landing', component: () => import('@/views/LandingView.vue'),  meta: { public: true, fullscreen: true } },
    { path: '/splash', name: 'splash',  component: () => import('@/views/SplashView.vue'), meta: { public: true } },
    { path: '/login',         name: 'login',         component: () => import('@/views/LoginView.vue'),        meta: { public: true } },
    { path: '/register',      name: 'register',      component: () => import('@/views/RegisterView.vue'),     meta: { public: true } },
    { path: '/dashboard',     name: 'dashboard',     component: () => import('@/views/DashboardView.vue') },
    { path: '/recibos/add',   name: 'add-recibo',    component: () => import('@/views/AddReciboView.vue') },
    { path: '/recibos/:id',   name: 'recibo-detail', component: () => import('@/views/ReciboDetailView.vue') },
    { path: '/recibos/:id/payment', name: 'request-payment', component: () => import('@/views/RequestPaymentView.vue') },
    { path: '/recibos/pagar-multiple', name: 'request-payment-multiple', component: () => import('@/views/RequestPaymentMultipleView.vue') },
    { path: '/history',       name: 'history',       component: () => import('@/views/HistoryView.vue') },
    { path: '/profile',       name: 'profile',       component: () => import('@/views/ProfileView.vue') },
    { path: '/profile/edit',  name: 'edit-profile',  component: () => import('@/views/EditProfileView.vue') },

    // Admin login — público y fullscreen
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/AdminLoginView.vue'),
      meta: { public: true, fullscreen: true },
    },

    // Panel admin — protegido, sin phone-container
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { admin: true, fullscreen: true },
      children: [
        { path: '',          redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: 'Dashboard', admin: true, fullscreen: true } },
        { path: 'notificaciones-admin', name: 'admin-notificaciones-admin', component: () => import('@/views/admin/NotificacionesAdminView.vue'), meta: { title: 'Notificaciones', admin: true, fullscreen: true } },
        { path: 'clientes',          name: 'admin-clientes',          component: () => import('@/views/admin/ClientesView.vue'),          meta: { title: 'Clientes',             admin: true, fullscreen: true } },
        { path: 'recibos',           name: 'admin-recibos',           component: () => import('@/views/admin/RecibosView.vue'),           meta: { title: 'Recibos',              admin: true, fullscreen: true } },
        { path: 'notificaciones',    name: 'admin-notificaciones',    component: () => import('@/views/admin/TiposNotificacionView.vue'), meta: { title: 'Tipos de Notificación', admin: true, fullscreen: true } },
        { path: 'pagos',             name: 'admin-pagos',             component: () => import('@/views/admin/DashboardView.vue'),         meta: { title: 'Pagos',                admin: true, fullscreen: true } },
        { path: 'tareas',            name: 'admin-tareas',            component: () => import('@/views/admin/DashboardView.vue'),         meta: { title: 'Tareas',               admin: true, fullscreen: true } },
        { path: 'empresas',          name: 'admin-empresas',          component: () => import('@/views/admin/EmpresasServicioView.vue'),  meta: { title: 'Empresas de Servicio', admin: true, fullscreen: true } },
        { path: 'usuarios',          name: 'admin-usuarios',          component: () => import('@/views/admin/UsuariosView.vue'),          meta: { title: 'Usuarios',             admin: true, fullscreen: true } },
        { path: 'tipos-factura',     name: 'admin-tipos-factura',     component: () => import('@/views/admin/TiposFacturaView.vue'),      meta: { title: 'Tipos de Factura',     admin: true, fullscreen: true } },
        { path: 'estados-recibo',    name: 'admin-estados-recibo',    component: () => import('@/views/admin/EstadosReciboView.vue'),     meta: { title: 'Estados de Recibo',    admin: true, fullscreen: true } },
        { path: 'configuracion',     name: 'admin-configuracion',     component: () => import('@/views/admin/ConfiguracionView.vue'),    meta: { title: 'Configuración',        admin: true, fullscreen: true } },
      ],
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const auth      = useAuthStore()
  const adminAuth = useAdminAuthStore()

  if (to.meta.admin) {
    if (!adminAuth.isAuthenticated) return next('/admin/login')
    return next()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return next('/login')
  }

  if (to.name === 'add-recibo' && auth.isAuthenticated) {
    const plan = auth.user?.plan
    if (plan?.maxFacturas != null) {
      const recibosStore = useRecibosStore()
      if (recibosStore.recibos.length === 0) {
        await recibosStore.fetchRecibos().catch(() => {})
      }
      if (recibosStore.recibos.length >= plan.maxFacturas) {
        return next('/dashboard')
      }
    }
  }

  next()
})

export default router
