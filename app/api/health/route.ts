import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRuntimeDatabaseUrl, hasDatabaseConfig } from '@/lib/db-env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const runtimeUrl = getRuntimeDatabaseUrl()
  const checks: Record<string, string | number | boolean> = {
    databaseConfigured: hasDatabaseConfig(),
    runtimeUsesPooler: /:6543\//.test(runtimeUrl),
    runtimeHasPgbouncer: runtimeUrl.includes('pgbouncer=true'),
    directUrlConfigured: Boolean(
      process.env.DIRECT_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_PRISMA_URL
    ),
    anthropicKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
  }

  try {
    const vendorCount = await prisma.vendor.count()
    checks.vendorCount = vendorCount
    checks.database = 'ok'
    return NextResponse.json({ status: 'ok', checks })
  } catch (error) {
    checks.database = 'error'
    checks.error = error instanceof Error ? error.message : String(error)
    checks.hint =
      'Use Supabase Transaction pooler (port 6543) for DATABASE_URL. ' +
      'Set DIRECT_URL to Session/Direct connection (port 5432) if auto-derive fails.'
    return NextResponse.json({ status: 'error', checks }, { status: 500 })
  }
}
