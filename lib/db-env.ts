/**
 * Resolve and normalize the Postgres connection string for Prisma Client.
 * Supports Supabase transaction pooler (6543) and Vercel Postgres env var names.
 */

function appendParam(url: string, key: string, value: string): string {
  if (!url || url.includes(`${key}=`)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${key}=${value}`
}

function isPooledSupabaseUrl(url: string): boolean {
  return /pooler\.supabase\.com:6543/i.test(url)
}

function isDirectSupabaseUrl(url: string): boolean {
  return /(?:db\.[a-z0-9-]+\.supabase\.co:5432|pooler\.supabase\.com:5432)/i.test(url)
}

export function getRuntimeDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''

  if (!url) return url

  url = appendParam(url, 'sslmode', 'require')

  if (isPooledSupabaseUrl(url)) {
    return appendParam(appendParam(url, 'pgbouncer', 'true'), 'connection_limit', '1')
  }

  if (isDirectSupabaseUrl(url)) {
    // Direct/session Supabase URL — do not use pgbouncer mode
    return url.replace(/([?&])pgbouncer=true&?/g, '$1').replace(/[?&]$/, '')
  }

  return url
}

export function getDirectDatabaseUrl(): string {
  const explicit =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL

  if (explicit) {
    return appendParam(
      explicit.replace(/([?&])pgbouncer=true&?/g, '$1').replace(/[?&]$/, ''),
      'sslmode',
      'require'
    )
  }

  const runtime = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

  if (isPooledSupabaseUrl(runtime)) {
    const derived = runtime
      .replace(':6543/', ':5432/')
      .replace(/([?&])pgbouncer=true&?/g, '$1')
      .replace(/([?&])connection_limit=1&?/g, '$1')
      .replace(/[?&]$/, '')
    return appendParam(derived, 'sslmode', 'require')
  }

  return getRuntimeDatabaseUrl()
}

export function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DIRECT_URL
  )
}
