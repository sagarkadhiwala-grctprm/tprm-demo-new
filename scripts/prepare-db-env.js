/**
 * Normalize Supabase / Vercel Postgres env vars for Prisma.
 * Run before prisma generate / migrate / db push on Vercel.
 */

function appendParam(url, key, value) {
  if (!url || url.includes(`${key}=`)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${key}=${value}`
}

function isPooledSupabaseUrl(url) {
  return /pooler\.supabase\.com:6543/i.test(url)
}

function isDirectSupabaseUrl(url) {
  return /(?:db\.[a-z0-9-]+\.supabase\.co:5432|pooler\.supabase\.com:5432)/i.test(url)
}

// Vercel Supabase integration uses these names
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL
}
if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING
}
if (!process.env.DIRECT_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DIRECT_URL = process.env.POSTGRES_PRISMA_URL
}

const dbUrl = process.env.DATABASE_URL
const directUrl = process.env.DIRECT_URL

if (dbUrl) {
  // Runtime: use transaction pooler (6543) with pgbouncer when on Supabase pooler
  if (isPooledSupabaseUrl(dbUrl)) {
    process.env.DATABASE_URL = appendParam(
      appendParam(dbUrl, 'pgbouncer', 'true'),
      'connection_limit',
      '1'
    )
  } else if (isDirectSupabaseUrl(dbUrl) && !directUrl) {
    // Single direct URL provided — use it for migrations; keep runtime on direct too
    process.env.DIRECT_URL = appendParam(dbUrl, 'sslmode', 'require')
    process.env.DATABASE_URL = process.env.DIRECT_URL
  } else {
    process.env.DATABASE_URL = appendParam(dbUrl, 'sslmode', 'require')
  }
}

if (process.env.DIRECT_URL) {
  // Migrations must not use pgbouncer mode
  process.env.DIRECT_URL = process.env.DIRECT_URL.replace(
    /([?&])pgbouncer=true&?/g,
    '$1'
  ).replace(/[?&]$/, '')
  process.env.DIRECT_URL = appendParam(process.env.DIRECT_URL, 'sslmode', 'require')
} else if (process.env.DATABASE_URL && isPooledSupabaseUrl(process.env.DATABASE_URL)) {
  // Derive session/direct pooler URL (5432) from transaction pooler (6543)
  const derived = process.env.DATABASE_URL
    .replace(':6543/', ':5432/')
    .replace(/([?&])pgbouncer=true&?/g, '$1')
    .replace(/([?&])connection_limit=1&?/g, '$1')
    .replace(/[?&]$/, '')
  process.env.DIRECT_URL = appendParam(derived, 'sslmode', 'require')
  console.log('[prepare-db-env] DIRECT_URL derived from transaction pooler URL (6543 -> 5432)')
} else if (process.env.DATABASE_URL) {
  process.env.DIRECT_URL = appendParam(
    process.env.DATABASE_URL.replace(/([?&])pgbouncer=true&?/g, '$1').replace(/[?&]$/, ''),
    'sslmode',
    'require'
  )
}

if (!process.env.DATABASE_URL) {
  console.error('[prepare-db-env] ERROR: DATABASE_URL is not configured')
  process.exit(1)
}

console.log('[prepare-db-env] DATABASE_URL configured:', Boolean(process.env.DATABASE_URL))
console.log('[prepare-db-env] DIRECT_URL configured:', Boolean(process.env.DIRECT_URL))
