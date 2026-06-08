import { PrismaClient } from '@prisma/client'
import { getRuntimeDatabaseUrl } from '@/lib/db-env'
import '@/lib/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'development') {
  console.warn(
    'SECURITY REMINDER: Make sure Row Level Security (RLS) is enabled on all Supabase tables. ' +
      'Go to: Supabase Dashboard → Table Editor → Your table → RLS → Enable RLS'
  )
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: getRuntimeDatabaseUrl() },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

globalForPrisma.prisma = prisma
