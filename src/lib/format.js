export const fmt = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
export const read = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj)
export const boolValue = (obj, key) => key === 'selled' ? (obj?.selled ?? obj?.isSelled ?? false) : (obj?.[key] ?? obj?.isActiveMetodoPag ?? false)
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
export const saleDate = (value = '') => {
  const [date, time = '00:00'] = value.split(' ')
  const [day, month, year] = (date || '').split('/').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return day && month && year ? new Date(2000 + year, month - 1, day, hour || 0, minute || 0) : null
}
export const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
