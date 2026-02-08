/** Email: standard format */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/** Phone: digits only, optional leading +, 10–15 digits (E.164 style) */
export const PHONE_REGEX = /^\+?[0-9]{10,15}$/

/** Username: letters, numbers, underscore; 3–30 chars */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const trimmed = email.trim()
  if (!trimmed) {
    return { valid: false, message: 'Email is required' }
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address' }
  }
  return { valid: true }
}

export function validatePhone(phone: string): { valid: boolean; message?: string } {
  const digitsOnly = phone.replace(/\s/g, '')
  if (!digitsOnly) {
    return { valid: false, message: 'Phone number is required' }
  }
  if (!PHONE_REGEX.test(digitsOnly)) {
    return {
      valid: false,
      message: 'Please enter a valid phone number (10–15 digits, optional + at start)',
    }
  }
  return { valid: true }
}

export function validateUsername(username: string): { valid: boolean; message?: string } {
  const trimmed = username.trim()
  if (!trimmed) {
    return { valid: false, message: 'Username is required' }
  }
  if (trimmed.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters' }
  }
  if (trimmed.length > 30) {
    return { valid: false, message: 'Username must be at most 30 characters' }
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      message: 'Username can only contain letters, numbers, and underscores',
    }
  }
  return { valid: true }
}

export { validatePassword } from './validate-password'
