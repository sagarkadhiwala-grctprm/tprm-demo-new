import { NextResponse } from 'next/server'

export function requireAdminPassword(request: Request) {
  const adminPassword = request.headers.get('x-admin-password')

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
