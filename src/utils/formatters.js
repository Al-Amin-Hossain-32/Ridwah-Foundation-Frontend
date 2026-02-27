// ─── Currency Format ────────────────────────────────────────
export const formatCurrency = (amount = 0) => {
  return `৳${Number(amount).toLocaleString('en-BD')}`
}

// ─── Date Format ─────────────────────────────────────────────
export const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ─── Time Ago ────────────────────────────────────────────────
export const timeAgo = (dateString) => {
  if (!dateString) return ''
  const diff = Date.now() - new Date(dateString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return 'এইমাত্র'
  if (mins < 60)  return `${mins} মিনিট আগে`
  if (hours < 24) return `${hours} ঘন্টা আগে`
  if (days < 7)   return `${days} দিন আগে`
  return formatDate(dateString)
}

// ─── Days Left ───────────────────────────────────────────────
export const daysLeft = (endDate) => {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate) - Date.now()) / 86400000)
  return Math.max(0, diff)
}

// ─── Progress Percent ────────────────────────────────────────
export const progressPercent = (raised = 0, goal = 1) => {
  return Math.min(100, Math.round((raised / goal) * 100))
}

// ─── Avatar Initials ─────────────────────────────────────────
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

// ─── Truncate text ───────────────────────────────────────────
export const truncate = (text = '', maxLen = 100) => {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}
