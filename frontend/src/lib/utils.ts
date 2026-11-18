import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(dateString?: string | Date | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

export function getStatusBadgeVariant(status: string) {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
    case 'PENDING':
    case 'UPCOMING':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
    case 'SUSPENDED':
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/10';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300 ring-gray-500/10';
  }
}
