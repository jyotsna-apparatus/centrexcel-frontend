const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/** Phone: digits only, optional leading +, 10–15 digits (E.164 style) */
const PHONE_REGEX = /^\+?[0-9]{10,15}$/

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

export { validatePassword } from './validate-password'
