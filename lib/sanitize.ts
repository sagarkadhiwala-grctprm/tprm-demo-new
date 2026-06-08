export function sanitize(str: unknown, maxLength = 500): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLength)
}

export function sanitizeStringArray(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxItems)
    .map((item) => sanitize(item, 200))
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}
