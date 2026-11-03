/**
 * Utilidades de formateo para ARCA Ltda. (CA-07)
 * - Moneda oficial: Bolivianos (Bs) con separador de miles '.' y decimales ','
 * - Fechas estándar en toda la aplicación: dd/mm/aaaa
 */

/**
 * Formatea un monto numérico a moneda nacional boliviana (Bs).
 * Ejemplo: 12500.5 -> "Bs 12.500,50"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Bs 0,00'
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) {
    return 'Bs 0,00'
  }

  const parts = num.toFixed(2).split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const decimalPart = parts[1]

  return `Bs ${integerPart},${decimalPart}`
}

/**
 * Formatea una fecha en formato estricto dd/mm/aaaa.
 * Soporta strings ISO ('2026-11-02', '2026-11-02T15:30:00Z') y objetos Date.
 * Ejemplo: new Date('2026-11-02') -> "02/11/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'

  let d: Date
  if (typeof date === 'string') {
    // Si viene en formato simple AAAA-MM-DD, parsear partes para evitar desfases de zona horaria
    const matchSimple = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    if (matchSimple) {
      const year = parseInt(matchSimple[1], 10)
      const month = parseInt(matchSimple[2], 10) - 1
      const day = parseInt(matchSimple[3], 10)
      d = new Date(year, month, day)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }

  if (Number.isNaN(d.getTime())) return '—'

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Formatea una fecha y hora en formato dd/mm/aaaa HH:mm.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'

  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'

  const dateFormatted = formatDate(d)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${dateFormatted} ${hours}:${minutes}`
}

/**
 * Formatea un número estándar con separador de miles '.' y decimales ','.
 */
export function formatNumber(value: number | string | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return '0'

  const fixed = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString()
  const [intPart, decPart] = fixed.split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt
}
