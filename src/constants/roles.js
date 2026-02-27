// User roles — backend থেকে match করা
export const ROLES = {
  USER:      'user',
  MANAGER:   'manager',
  LIBRARIAN: 'librarian',
  ADMIN:     'admin',
}

// Donation status
export const DONATION_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// Book request status
export const BOOK_REQUEST_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ISSUED:   'issued',
  RETURNED: 'returned',
  CANCELLED:'cancelled',
}

// Recurring donation intervals
export const RECURRING_INTERVALS = {
  WEEKLY:   'weekly',
  MONTHLY:  'monthly',
  YEARLY:   'yearly',
}
