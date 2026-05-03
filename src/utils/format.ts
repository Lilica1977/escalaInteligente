export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const formatPercentage = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`

export const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
