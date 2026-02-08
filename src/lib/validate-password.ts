/** At least one uppercase letter */
const UPPERCASE_REGEX = /[A-Z]/
/** At least one lowercase letter */
const LOWERCASE_REGEX = /[a-z]/
/** At least one digit */
const DIGIT_REGEX = /\d/
/** At least one symbol */
const SYMBOL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (!UPPERCASE_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!LOWERCASE_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!DIGIT_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  if (!SYMBOL_REGEX.test(password)) {
    return { valid: false, message: 'Password must contain at least one symbol (e.g. !@#$%^&*)' }
  }
  return { valid: true }
}
