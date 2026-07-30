// El total a pagar siempre se muestra redondeado hacia arriba a la centena
// (los últimos 2 dígitos en 00), para que el cliente pueda transferir un valor cerrado.
export function roundUpToHundred(value: number): number {
  return Math.ceil(value / 100) * 100
}
