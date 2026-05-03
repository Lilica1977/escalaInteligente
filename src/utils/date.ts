import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSunday,
  isSaturday,
  addDays,
  differenceInDays,
  getDay,
  isToday,
  isPast,
  isFuture,
  getMonth,
  getYear,
  getDaysInMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DayOfWeek } from '@/types'

export const formatDate = (date: string | Date, pattern = 'dd/MM/yyyy') =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern, { locale: ptBR })

export const formatDateLong = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

export const formatMonth = (month: number, year: number) => {
  const months = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ]
  return `${months[month - 1]} ${year}`
}

export const getDaysOfMonth = (month: number, year: number): Date[] => {
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(new Date(year, month - 1, 1))
  return eachDayOfInterval({ start, end })
}

export const getDayOfWeek = (date: Date | string): DayOfWeek => {
  const d = typeof date === 'string' ? parseISO(date) : date
  const days: DayOfWeek[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  return days[getDay(d)]
}

export const isWeekend = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isSunday(d) || isSaturday(d)
}

export const getConsecutiveDays = (dates: string[]): number => {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort()
  let maxConsecutive = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInDays(parseISO(sorted[i]), parseISO(sorted[i - 1]))
    if (diff === 1) {
      current++
      maxConsecutive = Math.max(maxConsecutive, current)
    } else {
      current = 1
    }
  }
  return maxConsecutive
}

export const getNextMonday = (date: Date): Date => {
  const day = getDay(date)
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  return addDays(date, daysUntilMonday)
}

export { isToday, isPast, isFuture, isSunday, isSaturday, addDays, getDay, getMonth, getYear, getDaysInMonth, parseISO, format }
