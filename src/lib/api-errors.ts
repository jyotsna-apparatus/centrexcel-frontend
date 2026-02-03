type ApiErrorDetail = { field?: string; message?: string }

type ApiErrorResult = {
  message?: string
  error?: string
  details?: ApiErrorDetail[]
}

export function getApiErrorMessage(result: unknown, fallback = 'Something went wrong'): string {
  if (result == null || typeof result !== 'object') return fallback
  const r = result as ApiErrorResult
  if (typeof r.message === 'string' && r.message.trim()) return r.message
  if (typeof r.error === 'string' && r.error.trim()) return r.error
  return fallback
}

export function getApiFieldErrors(result: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (result == null || typeof result !== 'object') return out
  const r = result as ApiErrorResult
  const details = r.details
  if (!Array.isArray(details)) return out
  for (const d of details) {
    if (d && typeof d.field === 'string' && typeof d.message === 'string') {
      out[d.field] = d.message
    }
  }
  return out
}
