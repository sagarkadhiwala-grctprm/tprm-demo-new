/**
 * One-time fix for Supabase P3009 (failed migration in _prisma_migrations).
 *
 * Usage (set DIRECT_URL to Supabase session/direct URL on port 5432):
 *   node scripts/repair-db.js
 *
 * Or on Windows PowerShell with env vars from .env.local:
 *   node scripts/prepare-db-env.js && node scripts/repair-db.js
 */

const { execSync } = require('child_process')
require('./prepare-db-env')

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const migrateEnv = { ...process.env, DATABASE_URL: directUrl }
const FAILED_MIGRATION = '20260607120000_add_extended_schema'

function run(cmd, allowFail = false) {
  try {
    execSync(cmd, { stdio: 'inherit', env: migrateEnv, shell: true })
    return true
  } catch {
    if (!allowFail) process.exit(1)
    return false
  }
}

console.log('[repair-db] Step 1: Sync schema with db push...')
run('npx prisma db push --skip-generate', false)

console.log(`[repair-db] Step 2: Mark "${FAILED_MIGRATION}" as applied...`)
run(`npx prisma migrate resolve --applied "${FAILED_MIGRATION}"`, true)

console.log('[repair-db] Step 3: Verify migration history...')
run('npx prisma migrate deploy', false)

console.log('[repair-db] Done — migration history is clean.')
