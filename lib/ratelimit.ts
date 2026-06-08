const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string): {
  success: boolean
  remaining: number
} {
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxRequests = 10

  const record = requestCounts.get(ip)

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: maxRequests - record.count }
}
