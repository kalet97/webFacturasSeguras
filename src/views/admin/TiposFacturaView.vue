<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, AlertCircle, RefreshCw } from 'lucide-vue-next'
import CrudModal from '@/components/admin/CrudModal.vue'
import { useAdminCrud } from '@/composables/admin/useAdminCrud'

interface TipoFactura { idTipoFactura: number; nombre: string; color: string | null }

const { items, loading, saving, error, formError, fetchAll, save } = useAdminCrud<TipoFactura>('/tipo-facturas')

const showModal  = ref(false)
const editing    = ref<TipoFactura | null>(null)
const form       = ref({ nombre: '', color: '#6366f1' })

function openCreate() {
  editing.value = null
  form.value = { nombre: '', color: '#6366f1' }
  showModal.value = true
}

function openEdit(item: TipoFactura) {
  editing.value = item
  form.value = { nombre: item.nombre, color: item.color ?? '#6366f1' }
  showModal.value = true
}

function close() { showModal.value = false }

async function submit() {
  const ok = await save({ nombre: form.value.nombre, color: form.value.color }, editing.value?.idTipoFactura)
  if (ok) close()
}

onMounted(fetchAll)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Tipos de Factura</h2>
        <p class="text-slate-500 text-sm mt-0.5">{{ items.length }} registros</p>
      </div>
      <div class="flex gap-2">
        <button @click="fetchAll" class="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition">
          <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        </button>
        <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition">
          <Plus class="w-4 h-4" /> Agregar
        </button>
      </div>
    </div>

    <div v-if="error" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-4 py-3 mb-4">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th class="text-left px-5 py-3.5">ID</th>
            <th class="text-left px-5 py-3.5">Nombre</th>
            <th class="text-left px-5 py-3.5">Color</th>
            <th class="px-5 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="items.length === 0">
            <td colspan="4" class="text-center py-12 text-slate-400 text-sm">Sin registros</td>
          </tr>
          <tr v-for="item in items" :key="item.idTipoFactura" class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-3.5 text-slate-400 font-mono text-xs">#{{ item.idTipoFactura }}</td>
            <td class="px-5 py-3.5 font-medium text-slate-800">{{ item.nombre }}</td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full border border-slate-200" :style="{ background: item.color ?? '#ccc' }" />
                <span class="text-slate-500 text-xs font-mono">{{ item.color ?? '—' }}</span>
              </div>
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

    <CrudModal :show="showModal" :title="editing ? 'Editar tipo de factura' : 'Nuevo tipo de factura'" :saving="saving" @close="close" @submit="submit">
      <div class="flex flex-col gap-4">
        <div v-if="formError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ formError }}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre <span class="text-danger">*</span></label>
          <input v-model="form.nombre" type="text" placeholder="Ej: Factura de servicios" class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
            <span class="text-sm text-slate-500 font-mono">{{ form.color }}</span>
          </div>
        </div>
      </div>
    </CrudModal>
  </div>
</template>
