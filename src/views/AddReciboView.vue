<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Hash, FileText, DollarSign, Calendar, AlertCircle, ChevronDown } from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import AppHeader from '@/components/AppHeader.vue'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const store  = useRecibosStore()
const auth   = useAuthStore()

interface EmpresaOption {
  id: number
  nombre: string
  color: string | null
  idTipoFactura: number | null
}

const empresas        = ref<EmpresaOption[]>([])
const loadingCatalogos = ref(true)

const form = ref({
  idEmpresaServicio: '',
  codigoRecibo:      '',
  nombre:            '',
  precio:            '',
  fechaOportuna:     '',
  fechaMaxima:       '',
  fechaSuspencion:   '',
  observacion:       '',
})

const loading       = ref(false)
const error         = ref('')
const precioDisplay = ref('')

function onPrecioInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  form.value.precio   = digits
  precioDisplay.value = digits ? Number(digits).toLocaleString('es-CO') : ''
  ;(e.target as HTMLInputElement).value = precioDisplay.value
}

onMounted(async () => {
  try {
    const data = await api.get<{ idEmpresaServicio: number; nombre: string; color: string | null; idTipoFactura: number | null }[]>(
      '/empresas-servicios',
      auth.token,
    )
    empresas.value = data.map(x => ({ id: x.idEmpresaServicio, nombre: x.nombre, color: x.color, idTipoFactura: x.idTipoFactura }))
  } finally {
    loadingCatalogos.value = false
  }
})

async function handleSave() {
  if (!form.value.idEmpresaServicio || !form.value.codigoRecibo ||
      !form.value.nombre            || !form.value.precio       || !form.value.fechaMaxima) {
    error.value = 'Completa los campos obligatorios'
    return
  }

  const empresa = empresas.value.find(e => e.id === Number(form.value.idEmpresaServicio))
  if (!empresa?.idTipoFactura) {
    error.value = 'La empresa seleccionada no tiene un tipo de factura configurado. Contacta al administrador.'
    return
  }

  error.value   = ''
  loading.value = true
  try {
    await store.createRecibo({
      idEmpresaServicio: empresa.id,
      idTipoFactura:     empresa.idTipoFactura,
      idEstadoRecibo:    1,
      codigoRecibo:      form.value.codigoRecibo,
      nombre:            form.value.nombre,
      precio:            Number(form.value.precio),
      fechaOportuna:     form.value.fechaOportuna  || null,
      fechaMaxima:       form.value.fechaMaxima     || null,
      fechaSuspencion:   form.value.fechaSuspencion || null,
      observacion:       form.value.observacion     || null,
    })
    router.replace('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al guardar el recibo'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="screen">
    <AppHeader title="Agregar recibo" />

    <div class="flex-1 overflow-y-auto px-4 pb-10">

      <!-- Cargando catálogos -->
      <div v-if="loadingCatalogos" class="flex items-center justify-center py-16">
        <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>

      <template v-else>
        <p class="text-sm text-slate-500 mb-5 pt-1">Los campos marcados con <span class="text-danger">*</span> son obligatorios</p>

        <div class="flex flex-col gap-4">

          <!-- Empresa de servicio -->
          <div>
            <label class="label">Empresa de servicio <span class="text-danger">*</span></label>
            <div class="relative">
              <ChevronDown class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select v-model="form.idEmpresaServicio" class="input-field appearance-none pr-10">
                <option value="" disabled>Selecciona una empresa</option>
                <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
          </div>

          <div class="h-px bg-slate-100" />

          <!-- Código / número de cuenta -->
          <div>
            <label class="label">Número de cuenta / código <span class="text-danger">*</span></label>
            <div class="relative">
              <Hash class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                v-model="form.codigoRecibo"
                type="text"
                placeholder="Ej: 001-2026-EPM"
                class="input-field pl-11"
              />
            </div>
          </div>

          <!-- Nombre / descripción -->
          <div>
            <label class="label">Nombre del recibo <span class="text-danger">*</span></label>
            <div class="relative">
              <FileText class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                v-model="form.nombre"
                type="text"
                placeholder="Ej: Factura Energía Junio"
                class="input-field pl-11"
              />
            </div>
          </div>

          <!-- Valor -->
          <div>
            <label class="label">Valor <span class="text-danger">*</span></label>
            <div class="relative">
              <DollarSign class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                :value="precioDisplay"
                type="text"
                inputmode="numeric"
                placeholder="185.000"
                class="input-field pl-11"
                @input="onPrecioInput"
              />
            </div>
          </div>

          <div class="h-px bg-slate-100" />

          <!-- Fecha oportuna -->
          <div>
            <label class="label">Fecha de pago oportuno <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <div class="relative">
              <Calendar class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input v-model="form.fechaOportuna" type="date" class="input-field pl-11" />
            </div>
          </div>

          <!-- Fecha máxima -->
          <div>
            <label class="label">Fecha límite de pago <span class="text-danger">*</span></label>
            <div class="relative">
              <Calendar class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input v-model="form.fechaMaxima" type="date" class="input-field pl-11" />
            </div>
            <p class="text-xs text-slate-400 mt-1 ml-1">Última fecha antes de cobrar mora</p>
          </div>

          <!-- Fecha suspensión -->
          <div>
            <label class="label">Fecha de suspensión <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <div class="relative">
              <AlertCircle class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input v-model="form.fechaSuspencion" type="date" class="input-field pl-11" />
            </div>
          </div>

          <!-- Observación -->
          <div>
            <label class="label">Observación <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <textarea
              v-model="form.observacion"
              rows="3"
              placeholder="Notas adicionales sobre este recibo..."
              class="input-field resize-none"
            />
          </div>

          <div v-if="error" class="flex items-center gap-2 text-danger text-sm bg-danger-50 py-2.5 px-3 rounded-xl">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {{ error }}
          </div>

          <AppButton :loading="loading" @click="handleSave" class="mt-2">
            Guardar recibo
          </AppButton>

        </div>
      </template>
    </div>
  </div>
</template>
