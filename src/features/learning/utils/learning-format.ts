// El porcentaje lo calcula Laravel; puede llegar con decimales de coma flotante y solo se redondea para mostrarlo.
export function formatPercentage(percentage: number) {
  const value = Number.isFinite(percentage) ? Math.min(100, Math.max(0, percentage)) : 0
  return Math.round(value)
}

export function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = String(total % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}
