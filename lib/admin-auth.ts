import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export function isAdminAuthorized(adminPassword: string | null): boolean {
  const storedPassword = process.env.ADMIN_PASSWORD ?? ''
  const providedPassword = adminPassword ?? ''
  if (!storedPassword || !providedPassword) return false
  return safeCompare(providedPassword, storedPassword)
}

export function requireAdminPassword(request: Request) {
  const adminPassword = request.headers.get('x-admin-password')

  if (!isAdminAuthorized(adminPassword)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
