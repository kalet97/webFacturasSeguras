<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Pencil, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import CrudModal from '@/components/admin/CrudModal.vue'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

interface Rol      { idRol: number; nombre: string }
interface Usuario  { idUsuario: number; nombre: string; apellido: string; correo: string; activo: number; idRol: number }
interface Paginator { data: Usuario[]; current_page: number; last_page: number; total: number }

const adminAuth = useAdminAuthStore()

const items       = ref<Usuario[]>([])
const roles       = ref<Rol[]>([])
const loading     = ref(false)
const saving      = ref(false)
const error       = ref('')
const formError   = ref('')
const search      = ref('')
const currentPage = ref(1)
const lastPage    = ref(1)
const total       = ref(0)

const showModal = ref(false)
const editing   = ref<Usuario | null>(null)
const form      = ref({ nombre: '', apellido: '', correo: '', clave: '', activo: true, idRol: '' })

async function fetchRoles() {
  try { roles.value = await api.get<Rol[]>('/roles', adminAuth.token) } catch {}
}

async function fetchAll() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(currentPage.value) })
    if (search.value.trim()) params.set('search', search.value.trim())
    const data = await api.get<Paginator>(`/usuarios?${params}`, adminAuth.token)
    items.value = data.data
    lastPage.value = data.last_page
    total.value = data.total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar'
  } finally {
    loading.value = false
  }
}

watch(search, () => { currentPage.value = 1; fetchAll() })
watch(currentPage, fetchAll)

onMounted(() => { fetchRoles(); fetchAll() })

function rolNombre(idRol: number) {
  return roles.value.find(r => r.idRol === idRol)?.nombre ?? String(idRol)
}

function openCreate() {
  editing.value = null
  form.value = { nombre: '', apellido: '', correo: '', clave: '', activo: true, idRol: roles.value[0] ? String(roles.value[0].idRol) : '' }
  showModal.value = true
}

function openEdit(item: Usuario) {
  editing.value = item
  form.value = { nombre: item.nombre, apellido: item.apellido, correo: item.correo, clave: '', activo: Boolean(item.activo), idRol: String(item.idRol) }
  showModal.value = true
}

function close() { showModal.value = false }

async function submit() {
  formError.value = ''
  saving.value = true
  const payload: Record<string, unknown> = {
    nombre: form.value.nombre,
    apellido: form.value.apellido,
    correo: form.value.correo,
    activo: form.value.activo ? 1 : 0,
    idRol: Number(form.value.idRol),
  }
  if (form.value.clave) payload.clave = form.value.clave

  try {
    if (editing.value) {
      await api.put(`/usuarios/${editing.value.idUsuario}`, payload, adminAuth.token)
    } else {
      if (!form.value.clave) { formError.value = 'La contraseña es requerida'; saving.value = false; return }
      await api.post('/usuarios', payload, adminAuth.token)
    }
    await fetchAll()
    close()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Error al guardar'
  } finally {
    saving.value = false
  }
}

const pages = computed(() => {
  const p: number[] = []
  for (let i = Math.max(1, currentPage.value - 2); i <= Math.min(lastPage.value, currentPage.value + 2); i++) p.push(i)
  return p
})

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'
</script>

<template>
  <div class="p-6 lg:p-8 max-w-5xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Usuarios</h2>
        <p class="text-slate-500 text-sm mt-0.5">{{ total }} registros</p>
      </div>
      <div class="flex gap-2">
        <button @click="fetchAll" class="p-2 text-slate-500 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition">
          <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        </button>
        <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition">
          <Plus class="w-4 h-4" /> Agregar
        </button>
      </div>
    </div>

    <div class="relative mb-5">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input v-model="search" type="text" placeholder="Buscar por nombre, apellido o correo..." :class="['pl-10 ' + inputClass]" />
    </div>

    <div v-if="error" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-4 py-3 mb-4">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th class="text-left px-5 py-3.5">ID</th>
                <th class="text-left px-5 py-3.5">Nombre</th>
                <th class="text-left px-5 py-3.5">Correo</th>
                <th class="text-left px-5 py-3.5">Rol</th>
                <th class="text-left px-5 py-3.5">Estado</th>
                <th class="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="items.length === 0">
                <td colspan="6" class="text-center py-12 text-slate-400 text-sm">Sin registros</td>
              </tr>
              <tr v-for="item in items" :key="item.idUsuario" class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 text-slate-400 font-mono text-xs">#{{ item.idUsuario }}</td>
                <td class="px-5 py-3.5 font-medium text-slate-800">{{ item.nombre }} {{ item.apellido }}</td>
                <td class="px-5 py-3.5 text-slate-600">{{ item.correo }}</td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                    {{ rolNombre(item.idRol) }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-medium', item.activo ? 'bg-success-50 text-success-600' : 'bg-slate-100 text-slate-500']">
                    {{ item.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <button @click="openEdit(item)" class="text-slate-400 hover:text-primary-600 transition p-1.5 rounded-lg hover:bg-primary-50">
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="lastPage > 1" class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p class="text-xs text-slate-500">Página {{ currentPage }} de {{ lastPage }}</p>
          <div class="flex items-center gap-1">
            <button @click="currentPage--" :disabled="currentPage === 1" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button v-for="p in pages" :key="p" @click="currentPage = p" :class="['min-w-[32px] h-8 rounded-lg text-xs font-medium transition', p === currentPage ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100']">{{ p }}</button>
            <button @click="currentPage++" :disabled="currentPage === lastPage" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <CrudModal :show="showModal" :title="editing ? 'Editar usuario' : 'Nuevo usuario'" :saving="saving" @close="close" @submit="submit">
      <div class="flex flex-col gap-4">
        <div v-if="formError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ formError }}
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre <span class="text-danger">*</span></label>
            <input v-model="form.nombre" type="text" placeholder="Juan" :class="inputClass" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Apellido <span class="text-danger">*</span></label>
            <input v-model="form.apellido" type="text" placeholder="Pérez" :class="inputClass" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Correo <span class="text-danger">*</span></label>
          <input v-model="form.correo" type="email" placeholder="usuario@ejemplo.com" :class="inputClass" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Contraseña
            <span class="text-slate-400 text-xs font-normal">{{ editing ? '(dejar vacío para no cambiar)' : '*' }}</span>
          </label>
          <input v-model="form.clave" type="password" placeholder="••••••••" :class="inputClass" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Rol <span class="text-danger">*</span></label>
          <select v-model="form.idRol" :class="inputClass">
            <option value="" disabled>Selecciona un rol</option>
            <option v-for="r in roles" :key="r.idRol" :value="r.idRol">{{ r.nombre }}</option>
          </select>
        </div>
        <div class="flex items-center justify-between py-1">
          <p class="text-sm font-medium text-slate-700">Activo</p>
          <button type="button" @click="form.activo = !form.activo" :class="['relative w-11 h-6 rounded-full transition-colors', form.activo ? 'bg-primary-600' : 'bg-slate-300']">
            <span :class="['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.activo && 'translate-x-5']" />
          </button>
        </div>
      </div>
    </CrudModal>
  </div>
</template>
