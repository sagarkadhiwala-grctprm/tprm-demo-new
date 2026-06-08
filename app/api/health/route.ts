import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const vendorCount = await prisma.vendor.count()
    return NextResponse.json({ status: 'ok', vendorCount })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
