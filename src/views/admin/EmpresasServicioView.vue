<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, AlertCircle, RefreshCw, ChevronDown, ImageIcon, X, Upload } from 'lucide-vue-next'
import CrudModal from '@/components/admin/CrudModal.vue'
import { useAdminCrud } from '@/composables/admin/useAdminCrud'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

interface TipoFactura { idTipoFactura: number; nombre: string }
interface EmpresaServicio {
  idEmpresaServicio: number
  nombre: string
  color: string | null
  activo: number
  link: string | null
  idTipoFactura: number | null
  tipo_factura: TipoFactura | null
  urlTutorial: string | null
}

const adminAuth = useAdminAuthStore()
const { items, loading, saving, error, formError, fetchAll, save } = useAdminCrud<EmpresaServicio>('/empresas-servicios')

const tiposFactura    = ref<TipoFactura[]>([])
const showModal       = ref(false)
const editing         = ref<EmpresaServicio | null>(null)
const form            = ref({ nombre: '', color: '#6366f1', activo: true, link: '', idTipoFactura: '', urlTutorial: '' })
const tutorialFile    = ref<File | null>(null)
const tutorialPreview = ref<string>('')
const uploadError     = ref('')
const uploading       = ref(false)

function openCreate() {
  editing.value      = null
  tutorialFile.value  = null
  tutorialPreview.value = ''
  uploadError.value  = ''
  form.value = { nombre: '', color: '#6366f1', activo: true, link: '', idTipoFactura: '', urlTutorial: '' }
  showModal.value = true
}

function openEdit(item: EmpresaServicio) {
  editing.value = item
  tutorialFile.value  = null
  tutorialPreview.value = item.urlTutorial ?? ''
  uploadError.value  = ''
  form.value = {
    nombre:        item.nombre,
    color:         item.color ?? '#6366f1',
    activo:        Boolean(item.activo),
    link:          item.link ?? '',
    idTipoFactura: item.idTipoFactura ? String(item.idTipoFactura) : '',
    urlTutorial:   item.urlTutorial ?? '',
  }
  showModal.value = true
}

function close() { showModal.value = false }

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return
  tutorialFile.value    = file
  tutorialPreview.value = URL.createObjectURL(file)
  uploadError.value     = ''
}

function clearTutorial() {
  tutorialFile.value    = null
  tutorialPreview.value = ''
  form.value.urlTutorial = ''
}

async function submit() {
  uploadError.value = ''
  let urlTutorial   = form.value.urlTutorial || null

  if (tutorialFile.value) {
    uploading.value = true
    try {
      const fd = new FormData()
      fd.append('archivo', tutorialFile.value)
      const result = await api.upload<{ url: string }>('/upload/tutorial-empresa', fd, adminAuth.token)
      urlTutorial = result.url
    } catch (e: any) {
      uploadError.value = e?.message || 'Error al subir la imagen'
      uploading.value   = false
      return
    }
    uploading.value = false
  }

  const ok = await save(
    {
      nombre:        form.value.nombre,
      color:         form.value.color,
      activo:        form.value.activo ? 1 : 0,
      link:          form.value.link.trim() || null,
      idTipoFactura: form.value.idTipoFactura ? Number(form.value.idTipoFactura) : null,
      urlTutorial,
    },
    editing.value?.idEmpresaServicio,
  )
  if (ok) close()
}

onMounted(async () => {
  fetchAll()
  try {
    tiposFactura.value = await api.get<TipoFactura[]>('/tipo-facturas', adminAuth.token)
  } catch {}
})
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Empresas de Servicio</h2>
        <p class="text-slate-500 text-sm mt-0.5">{{ items.length }} registros</p>
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
            <th class="text-left px-5 py-3.5">Tipo factura</th>
            <th class="text-left px-5 py-3.5">Color</th>
            <th class="text-left px-5 py-3.5">Link de pago</th>
            <th class="text-left px-5 py-3.5">Tutorial</th>
            <th class="text-left px-5 py-3.5">Estado</th>
            <th class="px-5 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="items.length === 0">
            <td colspan="8" class="text-center py-12 text-slate-400 text-sm">Sin registros</td>
          </tr>
          <tr v-for="item in items" :key="item.idEmpresaServicio" class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-3.5 text-slate-400 font-mono text-xs">#{{ item.idEmpresaServicio }}</td>
            <td class="px-5 py-3.5 font-medium text-slate-800">{{ item.nombre }}</td>
            <td class="px-5 py-3.5 text-slate-600 text-sm">{{ item.tipo_factura?.nombre ?? '—' }}</td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full border border-slate-200" :style="{ background: item.color ?? '#ccc' }" />
                <span class="text-slate-500 text-xs font-mono">{{ item.color ?? '—' }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 max-w-[180px]">
              <a
                v-if="item.link"
                :href="item.link"
                target="_blank"
                rel="noopener"
                class="text-primary-600 hover:underline text-xs truncate block"
                :title="item.link"
              >{{ item.link }}</a>
              <span v-else class="text-slate-300 text-sm">—</span>
            </td>
            <td class="px-5 py-3.5">
              <a
                v-if="item.urlTutorial"
                :href="item.urlTutorial"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                title="Ver imagen tutorial"
              >
                <ImageIcon class="w-4 h-4" />
                Ver
              </a>
              <span v-else class="text-slate-300 text-sm">—</span>
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

    <CrudModal :show="showModal" :title="editing ? 'Editar empresa' : 'Nueva empresa de servicio'" :saving="saving || uploading" @close="close" @submit="submit">
      <div class="flex flex-col gap-4">
        <div v-if="formError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ formError }}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre <span class="text-danger">*</span></label>
          <input v-model="form.nombre" type="text" placeholder="Ej: EPM" class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Tipo de factura</label>
          <div class="relative">
            <ChevronDown class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select v-model="form.idTipoFactura" class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition">
              <option value="">Sin tipo de factura</option>
              <option v-for="t in tiposFactura" :key="t.idTipoFactura" :value="t.idTipoFactura">{{ t.nombre }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Link de pago</label>
          <input
            v-model="form.link"
            type="url"
            placeholder="https://pagos.empresa.com/..."
            class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
          <p class="text-xs text-slate-400 mt-1">URL donde el cliente puede pagar la factura en línea (opcional)</p>
        </div>

        <!-- Tutorial image upload -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Imagen tutorial</label>
          <p class="text-xs text-slate-400 mb-2">Soporte visual que muestra al cliente dónde encontrar los datos del recibo</p>

          <!-- Preview -->
          <div v-if="tutorialPreview" class="relative mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img :src="tutorialPreview" alt="Vista previa del tutorial" class="w-full max-h-48 object-contain" />
            <button
              type="button"
              @click="clearTutorial"
              class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-full shadow text-slate-500 hover:text-danger hover:border-danger-100 transition"
              title="Quitar imagen"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Upload zone -->
          <label class="flex flex-col items-center gap-2 px-4 py-5 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Upload class="w-5 h-5 text-slate-400" />
            <span class="text-sm text-slate-500">
              {{ tutorialPreview ? 'Cambiar imagen' : 'Seleccionar imagen' }}
            </span>
            <span class="text-xs text-slate-400">JPG, PNG o WebP · máx. 10 MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileChange" />
          </label>

          <div v-if="uploadError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2 mt-2">
            <AlertCircle class="w-4 h-4 shrink-0" /> {{ uploadError }}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
            <span class="text-sm text-slate-500 font-mono">{{ form.color }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between py-1">
          <div>
            <p class="text-sm font-medium text-slate-700">Activo</p>
            <p class="text-xs text-slate-400">La empresa aparecerá disponible para los clientes</p>
          </div>
          <button
            type="button"
            @click="form.activo = !form.activo"
            :class="['relative w-11 h-6 rounded-full transition-colors', form.activo ? 'bg-primary-600' : 'bg-slate-300']"
          >
            <span :class="['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.activo && 'translate-x-5']" />
          </button>
        </div>
      </div>
    </CrudModal>
  </div>
</template>
