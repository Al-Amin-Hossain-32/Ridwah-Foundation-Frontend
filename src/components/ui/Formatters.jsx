// ── formatCurrency ─────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0
  if (num >= 10_000_000) return `৳${(num / 10_000_000).toFixed(1)}কোটি`
  if (num >= 100_000)    return `৳${(num / 100_000).toFixed(1)}লাখ`
  if (num >= 1_000)      return `৳${num.toLocaleString('bn-BD')}`
  return `৳${num}`
}

// ── formatDate ─────────────────────────────────────────────────────────────────
export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      day:   'numeric',
      month: 'short',
      year:  'numeric',
      ...opts,
    })
  } catch {
    return '—'
  }
}

// ── timeAgo ────────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)

  if (diff < 60)         return 'এইমাত্র'
  if (diff < 3600)       return `${Math.floor(diff / 60)} মিনিট আগে`
  if (diff < 86400)      return `${Math.floor(diff / 3600)} ঘণ্টা আগে`
  if (diff < 604800)     return `${Math.floor(diff / 86400)} দিন আগে`
  if (diff < 2592000)    return `${Math.floor(diff / 604800)} সপ্তাহ আগে`
  if (diff < 31536000)   return `${Math.floor(diff / 2592000)} মাস আগে`
  return `${Math.floor(diff / 31536000)} বছর আগে`
}

// ── truncate ───────────────────────────────────────────────────────────────────
export function truncate(str, len = 80) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len).trimEnd() + '…' : str
}