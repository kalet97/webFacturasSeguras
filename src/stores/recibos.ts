import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ReciboStatus = 'pending' | 'soon' | 'overdue' | 'paid'
export type ServiceType = 'energia' | 'agua' | 'gas' | 'internet' | 'telefono' | 'tv'

export interface Notification {
  id: string
  date: string
  type: 'sms' | 'call' | 'visit' | 'payment'
  description: string
}

export interface Recibo {
  id: string
  serviceType: ServiceType
  company: string
  clientNumber: string
  dueDate: string
  address: string
  amount?: number
  status: ReciboStatus
  daysLeft: number
  notifications: Notification[]
}

export interface HistoryItem {
  id: string
  type: 'call' | 'reminder' | 'payment' | 'visit'
  date: string
  description: string
  reciboId: string
  reciboName: string
  amount?: number
}

const mockRecibos: Recibo[] = [
  {
    id: '1',
    serviceType: 'energia',
    company: 'EPM',
    clientNumber: '1234567890',
    dueDate: '2026-06-04',
    address: 'Carrera 7 #45-12, Bogotá',
    amount: 185000,
    status: 'soon',
    daysLeft: 5,
    notifications: [
      { id: 'n1', date: '2026-05-28', type: 'sms', description: 'Recordatorio enviado por SMS' },
      { id: 'n2', date: '2026-05-25', type: 'call', description: 'Llamada preventiva realizada' },
    ],
  },
  {
    id: '2',
    serviceType: 'agua',
    company: 'Acueducto Bogotá',
    clientNumber: '0987654321',
    dueDate: '2026-06-15',
    address: 'Carrera 7 #45-12, Bogotá',
    amount: 65000,
    status: 'pending',
    daysLeft: 16,
    notifications: [
      { id: 'n3', date: '2026-05-20', type: 'sms', description: 'Primer recordatorio enviado' },
    ],
  },
  {
    id: '3',
    serviceType: 'gas',
    company: 'Gas Natural',
    clientNumber: '1122334455',
    dueDate: '2026-05-28',
    address: 'Carrera 7 #45-12, Bogotá',
    amount: 42000,
    status: 'overdue',
    daysLeft: -2,
    notifications: [
      { id: 'n4', date: '2026-05-27', type: 'call', description: 'Llamada urgente realizada' },
      { id: 'n5', date: '2026-05-26', type: 'sms', description: 'Alerta de vencimiento enviada' },
      { id: 'n6', date: '2026-05-20', type: 'sms', description: 'Recordatorio enviado' },
    ],
  },
  {
    id: '4',
    serviceType: 'internet',
    company: 'Claro',
    clientNumber: '5544332211',
    dueDate: '2026-06-20',
    address: 'Carrera 7 #45-12, Bogotá',
    amount: 89000,
    status: 'paid',
    daysLeft: 21,
    notifications: [
      { id: 'n7', date: '2026-05-15', type: 'payment', description: 'Pago realizado exitosamente' },
    ],
  },
]

const mockHistory: HistoryItem[] = [
  { id: 'h1', type: 'call', date: '2026-05-29', description: 'Llamada preventiva a cliente', reciboId: '1', reciboName: 'EPM - Energía' },
  { id: 'h2', type: 'payment', date: '2026-05-28', description: 'Pago realizado por encargo', reciboId: '4', reciboName: 'Claro - Internet', amount: 89000 },
  { id: 'h3', type: 'reminder', date: '2026-05-27', description: 'SMS recordatorio enviado', reciboId: '3', reciboName: 'Gas Natural' },
  { id: 'h4', type: 'visit', date: '2026-05-26', description: 'Visita domiciliaria realizada', reciboId: '3', reciboName: 'Gas Natural' },
  { id: 'h5', type: 'reminder', date: '2026-05-25', description: 'SMS recordatorio enviado', reciboId: '2', reciboName: 'Acueducto Bogotá' },
  { id: 'h6', type: 'call', date: '2026-05-24', description: 'Llamada preventiva a cliente', reciboId: '2', reciboName: 'Acueducto Bogotá' },
]

export const useRecibosStore = defineStore('recibos', () => {
  const recibos = ref<Recibo[]>(mockRecibos)
  const history = ref<HistoryItem[]>(mockHistory)

  function getReciboById(id: string) {
    return recibos.value.find(r => r.id === id)
  }

  function addRecibo(data: Omit<Recibo, 'id' | 'status' | 'daysLeft' | 'notifications'>) {
    const dueDate = new Date(data.dueDate)
    const today = new Date()
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let status: ReciboStatus = 'pending'
    if (daysLeft < 0) status = 'overdue'
    else if (daysLeft <= 5) status = 'soon'
    else status = 'pending'

    const newRecibo: Recibo = {
      ...data,
      id: Date.now().toString(),
      status,
      daysLeft,
      notifications: [],
    }
    recibos.value.unshift(newRecibo)
    return newRecibo
  }

  function updateRecibo(id: string, updates: Partial<Recibo>) {
    const index = recibos.value.findIndex(r => r.id === id)
    if (index !== -1) {
      recibos.value[index] = { ...recibos.value[index], ...updates }
    }
  }

  const serviceLabels: Record<ServiceType, string> = {
    energia: 'Energía Eléctrica',
    agua: 'Agua',
    gas: 'Gas Natural',
    internet: 'Internet',
    telefono: 'Teléfono',
    tv: 'TV por Cable',
  }

  const serviceIcons: Record<ServiceType, string> = {
    energia: '⚡',
    agua: '💧',
    gas: '🔥',
    internet: '📶',
    telefono: '📞',
    tv: '📺',
  }

  const serviceColors: Record<ServiceType, string> = {
    energia: 'bg-warning-50 text-warning-600',
    agua: 'bg-primary-50 text-primary-600',
    gas: 'bg-orange-50 text-orange-600',
    internet: 'bg-purple-50 text-purple-600',
    telefono: 'bg-success-50 text-success-600',
    tv: 'bg-pink-50 text-pink-600',
  }

  return {
    recibos,
    history,
    getReciboById,
    addRecibo,
    updateRecibo,
    serviceLabels,
    serviceIcons,
    serviceColors,
  }
})
