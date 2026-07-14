import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatKm(km: number): string {
  return new Intl.NumberFormat('fr-FR').format(km) + ' km'
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
}

export function formatPercent(value: number): string {
  return Math.round(value) + '%'
}

export function getInitials(firstName: string, lastName: string): string {
  return (firstName[0] + lastName[0]).toUpperCase()
}

export function calcMargin(sell: number, buy: number) {
  const margin = sell - buy
  const pct = buy > 0 ? (margin / buy) * 100 : 0
  return { margin, pct: Math.round(pct) }
}

export function calcMonthlyPayment(
  price: number,
  deposit: number,
  months: number,
  ratePercent: number
): number {
  const principal = price - deposit
  const monthlyRate = ratePercent / 100 / 12
  if (monthlyRate === 0) return Math.round(principal / months)
  const payment =
    principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  return Math.round(payment)
}

export const STATUS_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  réservé: 'Réservé',
  vendu: 'Vendu',
  prospect: 'Prospect',
  actif: 'Actif',
  fidèle: 'Fidèle',
  inactif: 'Inactif',
  brouillon: 'Brouillon',
  envoyé: 'Envoyé',
  en_attente: 'En attente',
  accepté: 'Accepté',
  refusé: 'Refusé',
  expiré: 'Expiré',
  payé: 'Payé',
}

export const STATUS_COLORS: Record<string, string> = {
  disponible: 'bg-blue-50 text-blue-800',
  réservé: 'bg-amber-50 text-amber-800',
  vendu: 'bg-green-50 text-green-800',
  prospect: 'bg-amber-50 text-amber-800',
  actif: 'bg-blue-50 text-blue-800',
  fidèle: 'bg-blue-50 text-blue-800',
  inactif: 'bg-gray-100 text-gray-600',
  brouillon: 'bg-gray-100 text-gray-600',
  envoyé: 'bg-blue-50 text-blue-800',
  en_attente: 'bg-amber-50 text-amber-800',
  accepté: 'bg-green-50 text-green-800',
  refusé: 'bg-red-50 text-red-800',
  expiré: 'bg-red-50 text-red-800',
  payé: 'bg-green-50 text-green-800',
}
