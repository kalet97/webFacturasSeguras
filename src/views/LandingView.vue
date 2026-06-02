<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Zap, Droplets, Flame, Wifi, Phone, Tv,
  Check, CheckCircle, XCircle, Bell, Shield, Clock, Users, Star,
} from 'lucide-vue-next'

const router = useRouter()
const auth   = useAuthStore()

onMounted(() => {
  if (auth.isAuthenticated) router.replace('/dashboard')
  window.addEventListener('scroll', onScroll)
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const scrolled = ref(false)
function onScroll() { scrolled.value = window.scrollY > 24 }

const services = [
  { icon: Zap,      label: 'Energía',   bg: 'bg-yellow-50',   color: 'text-yellow-500' },
  { icon: Droplets, label: 'Agua',      bg: 'bg-blue-50',     color: 'text-blue-500'   },
  { icon: Flame,    label: 'Gas',       bg: 'bg-orange-50',   color: 'text-orange-500' },
  { icon: Wifi,     label: 'Internet',  bg: 'bg-primary-50',  color: 'text-primary'    },
  { icon: Phone,    label: 'Teléfono',  bg: 'bg-green-50',    color: 'text-green-500'  },
  { icon: Tv,       label: 'TV',        bg: 'bg-purple-50',   color: 'text-purple-500' },
]

const steps = [
  {
    n: '01',
    title: 'Registra tus facturas',
    desc: 'Ingresa una sola vez el nombre del servicio y las fechas de vencimiento. Nada más.',
  },
  {
    n: '02',
    title: 'Nosotros hacemos el seguimiento',
    desc: 'Te llamamos, te enviamos recordatorios por WhatsApp y hacemos visita si es necesario.',
  },
  {
    n: '03',
    title: 'Paga tranquilo, a tiempo',
    desc: 'Sin multas por mora, sin cortes de servicio. Y si quieres, incluso pagamos por ti.',
  },
]

const problems = [
  '¿Se te venció la factura de luz y te cobraron reconexión?',
  '¿Olvidaste pagar el internet y estuviste días sin servicio?',
  '¿Son 5 facturas distintas y cada mes se te enreda una diferente?',
  '¿Tu familiar mayor no sabe cómo pagar los servicios digitalmente?',
]

const benefits = [
  { icon: Bell,   title: 'Alertas antes de que venza',   desc: 'Te contactamos con días de anticipación para que nunca pagues tarde.' },
  { icon: Shield, title: 'Servicio humano real',          desc: 'No es un bot. Es una persona real que te llama y está pendiente de ti.' },
  { icon: Clock,  title: 'Sin aprender nada nuevo',      desc: 'Tú solo registras tus facturas. Nosotros hacemos todo lo demás.' },
  { icon: Users,  title: 'Para toda la familia',         desc: 'Ideal para adultos mayores o personas con vida ocupada.' },
]

const plans = [
  {
    name: 'Esencial',
    price: '$7.900',
    highlight: false,
    features: [
      'Hasta 12 facturas gestionadas',
      'Notificaciones por WhatsApp ilimitadas',
      '2 llamadas de cortesía al mes',
      'Panel de seguimiento en app',
    ],
  },
  {
    name: 'Total',
    price: '$14.900',
    badge: 'Más popular',
    highlight: true,
    features: [
      'Facturas ilimitadas',
      'Llamadas ilimitadas',
      '1 visita al mes si hay riesgo de corte',
      'Pago por encargo sin comisión extra',
      'Soporte prioritario',
    ],
  },
]

const mockRecibos = [
  { initial: 'E', name: 'Energía EPM',   days: '3d',  status: 'Vence pronto', sbg: 'bg-warning-50',  stext: 'text-warning-600',  ibg: 'bg-warning-50',  itext: 'text-warning-600' },
  { initial: 'A', name: 'Acueducto',     days: '12d', status: 'Al día',       sbg: 'bg-success-50',  stext: 'text-success-600',  ibg: 'bg-success-50',  itext: 'text-success-600' },
  { initial: 'C', name: 'Internet Claro',days: '1d',  status: 'Urgente',      sbg: 'bg-danger-50',   stext: 'text-danger-600',   ibg: 'bg-danger-50',   itext: 'text-danger-600'  },
  { initial: 'G', name: 'Gas Natural',   days: '8d',  status: 'Al día',       sbg: 'bg-success-50',  stext: 'text-success-600',  ibg: 'bg-success-50',  itext: 'text-success-600' },
]
</script>

<template>
  <div class="min-h-screen bg-white font-sans">

    <!-- ─── NAVBAR ─── -->
    <nav
      class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      :class="scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow">
            <span class="text-sm font-black text-white">RS</span>
          </div>
          <span
            class="font-bold text-lg transition-colors duration-300"
            :class="scrolled ? 'text-gray-900' : 'text-white'"
          >Recibo Seguro</span>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <a
            href="#como-funciona"
            class="hidden sm:inline-block text-sm font-medium transition-colors duration-300"
            :class="scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/70 hover:text-white'"
          >Cómo funciona</a>
          <a
            href="#planes"
            class="hidden sm:inline-block text-sm font-medium transition-colors duration-300"
            :class="scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/70 hover:text-white'"
          >Planes</a>
          <button
            @click="router.push('/login')"
            class="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200"
            :class="scrolled
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              : 'bg-white text-primary-600 hover:bg-white/90'"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </nav>

    <!-- ─── HERO ─── -->
    <section class="relative bg-gradient-to-br from-primary-600 via-blue-700 to-blue-900 pt-24 pb-24 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div class="absolute top-1/2 -left-32 w-80 h-80 bg-blue-400/10 rounded-full blur-2xl" />
        <div class="absolute bottom-0 right-1/3 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <!-- Copy -->
        <div class="text-center lg:text-left">
          <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span class="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span class="text-white/90 text-sm font-medium">Disponible en Colombia</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Nunca más se te<br>
            <span class="text-yellow-300">venza una factura</span>
          </h1>

          <p class="mt-5 text-lg sm:text-xl text-blue-100 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Nosotros hacemos el seguimiento de tus servicios, te llamamos antes de que venzan y si quieres,
            <strong class="text-white font-semibold">los pagamos por ti</strong>.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <button
              @click="router.push('/register')"
              class="px-7 py-3.5 bg-white text-primary-700 font-bold rounded-2xl hover:bg-blue-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base"
            >
              Empieza gratis hoy →
            </button>
            <a
              href="#como-funciona"
              class="px-7 py-3.5 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 border border-white/20 transition-all text-base text-center"
            >
              Ver cómo funciona
            </a>
          </div>

          <p class="mt-4 text-blue-200/80 text-sm">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>

        <!-- App mockup -->
        <div class="flex justify-center lg:justify-end">
          <div class="relative w-60 sm:w-64">
            <div class="bg-gray-900 rounded-[40px] p-2.5 shadow-2xl ring-1 ring-white/10">
              <div class="bg-slate-50 rounded-[32px] overflow-hidden">
                <div class="bg-primary-600 px-4 pt-3 pb-5">
                  <div class="flex justify-between text-white/50 text-[10px] mb-2">
                    <span>9:41</span><span>●●●</span>
                  </div>
                  <p class="text-white/70 text-xs">Hola, María 👋</p>
                  <p class="text-white text-base font-black mt-0.5">Tus facturas</p>
                </div>
                <div class="p-3 space-y-2">
                  <div
                    v-for="r in mockRecibos"
                    :key="r.name"
                    class="bg-white rounded-2xl px-3 py-2.5 shadow-sm flex items-center gap-3"
                  >
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" :class="r.ibg">
                      <span class="text-xs font-bold" :class="r.itext">{{ r.initial }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold text-gray-800 truncate">{{ r.name }}</p>
                      <p class="text-[10px] text-gray-400">{{ r.days }} restantes</p>
                    </div>
                    <span
                      class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      :class="[r.sbg, r.stext]"
                    >{{ r.status }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Badge: factura pagada -->
            <div class="absolute -right-5 top-14 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 animate-float">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-success-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check class="w-4 h-4 text-success" />
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-800 whitespace-nowrap">¡Factura pagada!</p>
                  <p class="text-[10px] text-gray-400">3 días antes</p>
                </div>
              </div>
            </div>

            <!-- Badge: llamada -->
            <div class="absolute -left-6 bottom-20 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 animate-float-delayed">
              <div class="flex items-center gap-2">
                <span class="text-xl">📞</span>
                <div>
                  <p class="text-xs font-bold text-gray-800 whitespace-nowrap">Te llamamos hoy</p>
                  <p class="text-[10px] text-gray-400">Energía vence en 2d</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats strip -->
      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 mt-16">
        <div class="bg-white/10 backdrop-blur border border-white/20 rounded-2xl grid grid-cols-3 divide-x divide-white/20">
          <div class="py-5 px-4 text-center">
            <p class="text-2xl sm:text-3xl font-black text-white">6+</p>
            <p class="text-xs sm:text-sm text-blue-200 mt-0.5">Servicios cubiertos</p>
          </div>
          <div class="py-5 px-4 text-center">
            <p class="text-2xl sm:text-3xl font-black text-white">0%</p>
            <p class="text-xs sm:text-sm text-blue-200 mt-0.5">Cortes por olvido</p>
          </div>
          <div class="py-5 px-4 text-center">
            <p class="text-2xl sm:text-3xl font-black text-white">100%</p>
            <p class="text-xs sm:text-sm text-blue-200 mt-0.5">Humano, no un bot</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PROBLEMA ─── -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-black text-gray-900">¿Te suena familiar?</h2>
          <p class="mt-3 text-gray-500 text-lg">No estás solo. Miles de personas en Colombia pasan por lo mismo cada mes.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div
            v-for="(p, i) in problems"
            :key="i"
            class="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <XCircle class="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p class="text-gray-700 font-medium text-sm leading-relaxed">{{ p }}</p>
          </div>
        </div>
        <div class="mt-10 flex justify-center">
          <div class="inline-flex items-center gap-3 bg-success-50 text-success-600 px-6 py-3.5 rounded-2xl border border-success-100">
            <CheckCircle class="w-5 h-5 flex-shrink-0" />
            <p class="font-semibold text-sm sm:text-base">Con Recibo Seguro, nada de eso vuelve a pasarte.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CÓMO FUNCIONA ─── -->
    <section id="como-funciona" class="py-20 bg-white scroll-mt-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-14">
          <p class="text-primary-600 font-bold text-sm uppercase tracking-widest mb-2">Así de fácil</p>
          <h2 class="text-3xl sm:text-4xl font-black text-gray-900">Cómo funciona</h2>
          <p class="mt-3 text-gray-500 text-lg max-w-xl mx-auto">En 3 pasos simples, tus facturas nunca más se vencen sin que lo sepas.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div v-for="(step, i) in steps" :key="i" class="relative text-center">
            <div
              v-if="i < 2"
              class="hidden md:block absolute top-8 left-1/2 w-full h-px border-t-2 border-dashed border-primary-100"
            />
            <div class="relative z-10 w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-200">
              <span class="text-lg font-black">{{ step.n }}</span>
            </div>
            <h3 class="mt-5 text-lg font-bold text-gray-900">{{ step.title }}</h3>
            <p class="mt-2 text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── SERVICIOS ─── -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-black text-gray-900">Gestionamos todos tus servicios</h2>
          <p class="mt-2 text-gray-500">Energía, agua, gas, internet, teléfono, televisión y más.</p>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-4 max-w-2xl mx-auto">
          <div
            v-for="s in services"
            :key="s.label"
            class="flex flex-col items-center gap-2.5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="s.bg">
              <component :is="s.icon" class="w-6 h-6" :class="s.color" />
            </div>
            <span class="text-xs font-semibold text-gray-600">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── BENEFICIOS ─── -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-14">
          <p class="text-primary-600 font-bold text-sm uppercase tracking-widest mb-2">Por qué elegirnos</p>
          <h2 class="text-3xl sm:text-4xl font-black text-gray-900">No somos una app más de recordatorios</h2>
          <p class="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
            Somos un servicio <strong class="text-gray-700">humano respaldado por tecnología</strong>. Hay una persona real que te llama.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="b in benefits"
            :key="b.title"
            class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group cursor-default"
          >
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
              <component :is="b.icon" class="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
            </div>
            <h3 class="font-bold text-gray-900 mb-1.5">{{ b.title }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">{{ b.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PLANES ─── -->
    <section id="planes" class="py-20 bg-gradient-to-b from-gray-50 to-white scroll-mt-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-14">
          <p class="text-primary-600 font-bold text-sm uppercase tracking-widest mb-2">Planes</p>
          <h2 class="text-3xl sm:text-4xl font-black text-gray-900">Sin letra pequeña</h2>
          <p class="mt-3 text-gray-500 text-lg">Dos opciones claras. Sabes exactamente lo que pagas cada mes.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div
            v-for="plan in plans"
            :key="plan.name"
            class="relative rounded-3xl p-8 border-2 transition-all"
            :class="plan.highlight
              ? 'bg-primary-600 border-primary-600 shadow-2xl shadow-primary-200'
              : 'bg-white border-gray-200 shadow-sm'"
          >
            <div
              v-if="plan.badge"
              class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
            >{{ plan.badge }}</div>

            <p class="font-bold text-xl" :class="plan.highlight ? 'text-white' : 'text-gray-900'">{{ plan.name }}</p>

            <div class="flex items-end gap-1 mt-3 mb-6">
              <span class="text-4xl font-black" :class="plan.highlight ? 'text-white' : 'text-gray-900'">{{ plan.price }}</span>
              <span class="text-sm mb-1.5" :class="plan.highlight ? 'text-primary-200' : 'text-gray-400'">/mes</span>
            </div>

            <ul class="space-y-3 mb-8">
              <li
                v-for="f in plan.features"
                :key="f"
                class="flex items-start gap-2.5 text-sm"
              >
                <Check class="w-4 h-4 mt-0.5 flex-shrink-0" :class="plan.highlight ? 'text-primary-200' : 'text-success'" />
                <span :class="plan.highlight ? 'text-primary-100' : 'text-gray-600'">{{ f }}</span>
              </li>
            </ul>

            <button
              @click="router.push('/register')"
              class="w-full py-3 rounded-2xl font-bold text-sm transition-all"
              :class="plan.highlight
                ? 'bg-white text-primary-700 hover:bg-blue-50'
                : 'bg-primary-600 text-white hover:bg-primary-700'"
            >
              Empezar con {{ plan.name }}
            </button>
          </div>
        </div>
        <p class="text-center text-gray-400 text-sm mt-6">
          Cancela en cualquier momento · Pago mensual por Nequi o transferencia bancaria
        </p>
      </div>
    </section>

    <!-- ─── QUOTE ─── -->
    <section class="py-20 bg-primary-600 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
      </div>
      <div class="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div class="text-6xl text-white/30 font-black leading-none mb-4">"</div>
        <p class="text-2xl sm:text-3xl font-bold text-white leading-snug">
          Nunca más se te vence una factura. Nosotros te llamamos, te recordamos y si quieres, la pagamos por ti.
        </p>
        <div class="flex items-center justify-center gap-1 mt-8">
          <Star v-for="i in 5" :key="i" class="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </div>
        <p class="mt-3 text-primary-200 text-sm">Tranquilidad de verdad, mes a mes.</p>
      </div>
    </section>

    <!-- ─── CTA FINAL ─── -->
    <section class="py-24 bg-white">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
          ¿Listo para olvidarte<br class="hidden sm:block"> del estrés de las facturas?
        </h2>
        <p class="mt-4 text-gray-500 text-lg">Regístrate hoy. Es gratis para empezar.</p>
        <button
          @click="router.push('/register')"
          class="mt-8 px-10 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
        >
          Crear mi cuenta gratis
        </button>
        <p class="mt-3 text-gray-400 text-sm">Sin tarjeta de crédito · Cancela cuando quieras</p>
      </div>
    </section>

    <!-- ─── FOOTER ─── -->
    <footer class="bg-gray-900 py-10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
            <span class="text-xs font-black text-white">RS</span>
          </div>
          <span class="text-white font-bold">Recibo Seguro</span>
        </div>
        <p class="text-gray-500 text-sm text-center">
          © 2026 Recibo Seguro · Colombia · Nunca más una factura vencida
        </p>
        <button
          @click="router.push('/login')"
          class="text-sm text-gray-400 hover:text-white transition-colors font-medium"
        >
          Iniciar sesión →
        </button>
      </div>
    </footer>

  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
@keyframes float-delayed {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
.animate-float         { animation: float 3s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 3s ease-in-out infinite 1.5s; }
</style>
