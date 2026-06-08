import { NextResponse } from 'next/server'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const adminPassword = request.headers.get('x-admin-password')

  if (!isAdminAuthorized(adminPassword)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
