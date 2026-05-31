import { ref } from 'vue'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

export function useAdminCrud<T>(endpoint: string) {
  const adminAuth = useAdminAuthStore()
  const items     = ref<T[]>([])
  const loading   = ref(false)
  const saving    = ref(false)
  const error     = ref('')
  const formError = ref('')

  async function fetchAll() {
    loading.value = true
    error.value   = ''
    try {
      items.value = await api.get<T[]>(endpoint, adminAuth.token)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar'
    } finally {
      loading.value = false
    }
  }

  async function save(payload: Record<string, unknown>, id?: number | string): Promise<boolean> {
    saving.value    = true
    formError.value = ''
    try {
      if (id !== undefined) {
        await api.put(`${endpoint}/${id}`, payload, adminAuth.token)
      } else {
        await api.post(`${endpoint}`, payload, adminAuth.token)
      }
      await fetchAll()
      return true
    } catch (e: unknown) {
      formError.value = e instanceof Error ? e.message : 'Error al guardar'
      return false
    } finally {
      saving.value = false
    }
  }

  return { items, loading, saving, error, formError, fetchAll, save }
}
