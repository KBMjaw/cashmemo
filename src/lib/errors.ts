/**
 * Maps common Supabase/Postgres error shapes to friendly, user-facing copy.
 * Raw DB/server errors must never reach the UI (see spec section 39).
 */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback
  const message = typeof error === 'string' ? error : (error as { message?: string })?.message ?? ''
  const lower = message.toLowerCase()

  if (lower.includes('username') && (lower.includes('duplicate') || lower.includes('unique'))) {
    return 'That username is already taken.'
  }
  if (lower.includes('reserved')) {
    return 'That username is reserved. Please choose another.'
  }
  if (lower.includes('email') && lower.includes('already')) {
    return 'An account with this email already exists.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.'
  }
  if (lower.includes('password') && lower.includes('least')) {
    return 'Password must be at least 8 characters and include upper/lowercase letters and a number.'
  }
  if (lower.includes('network') || lower.includes('fetch failed')) {
    return 'Network error. Please check your connection and try again.'
  }
  if (lower.includes('file') && lower.includes('size')) {
    return 'Image size must be less than 5 MB.'
  }
  if (lower.includes('username_format') || lower.includes('check constraint')) {
    return 'Please check the highlighted fields and try again.'
  }
  return fallback
}
