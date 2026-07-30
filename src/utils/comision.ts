import type { PlanInfo } from '@/stores/auth'

export function calcComision(amount: number, plan: PlanInfo | null | undefined): number {
  if (!plan || amount <= plan.maxPrecioPorFactura) return 0
  return Math.round((amount - plan.maxPrecioPorFactura) * 0.004)
}
