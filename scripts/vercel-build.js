const { execSync } = require('child_process')
require('./prepare-db-env')

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const migrateEnv = { ...process.env, DATABASE_URL: directUrl }

const FAILED_MIGRATION = '20260607120000_add_extended_schema'

function run(cmd, env = process.env) {
  execSync(cmd, { stdio: 'inherit', env, shell: true })
}

function runCapture(cmd, env = process.env) {
  try {
    execSync(cmd, { stdio: 'pipe', env, shell: true })
    return { ok: true, output: '' }
  } catch (error) {
    const output = [
      error.stdout?.toString() ?? '',
      error.stderr?.toString() ?? '',
      error.message ?? '',
    ].join('\n')
    return { ok: false, output }
  }
}

function hasFailedMigrationError(output) {
  return /P3009|failed migrations|failed to apply/i.test(output)
}

function syncSchemaWithPush() {
  console.log('[vercel-build] Syncing schema with db push (direct connection)...')
  let result = runCapture('npx prisma db push --skip-generate', migrateEnv)
  if (result.ok) return true

  if (/data loss|destructive/i.test(result.output)) {
    console.log('[vercel-build] db push requires accept-data-loss, retrying...')
    result = runCapture(
      'npx prisma db push --skip-generate --accept-data-loss',
      migrateEnv
    )
  }

  if (!result.ok) {
    console.error('[vercel-build] db push failed:\n', result.output)
    return false
  }

  return true
}

function resolveFailedMigration() {
  console.log(
    `[vercel-build] Marking migration "${FAILED_MIGRATION}" as applied...`
  )
  const result = runCapture(
    `npx prisma migrate resolve --applied "${FAILED_MIGRATION}"`,
    migrateEnv
  )

  if (result.ok) {
    console.log('[vercel-build] Failed migration resolved')
    return true
  }

  // Already applied or not present in history — not fatal
  if (/already recorded as applied|P3008/i.test(result.output)) {
    console.log('[vercel-build] Migration already marked as applied')
    return true
  }

  console.warn('[vercel-build] migrate resolve warning:\n', result.output)
  return false
}

function deployMigrations() {
  console.log('[vercel-build] Applying migrations via direct connection...')
  return runCapture('npx prisma migrate deploy', migrateEnv)
}

console.log('[vercel-build] Generating Prisma client...')
run('npx prisma generate')

console.log('[vercel-build] Syncing database schema...')
let migrateResult = deployMigrations()

if (!migrateResult.ok) {
  if (hasFailedMigrationError(migrateResult.output)) {
    console.log(
      '[vercel-build] Found failed migration history (P3009) — recovering...'
    )
  } else {
    console.log('[vercel-build] migrate deploy failed — attempting recovery...')
  }

  if (!syncSchemaWithPush()) {
    process.exit(1)
  }

  resolveFailedMigration()

  migrateResult = deployMigrations()
  if (!migrateResult.ok) {
    console.warn(
      '[vercel-build] migrate deploy still reported issues after recovery:\n',
      migrateResult.output
    )
    console.log(
      '[vercel-build] Schema is synced via db push; continuing build.'
    )
  } else {
    console.log('[vercel-build] Migrations applied successfully after recovery')
  }
} else {
  console.log('[vercel-build] Migrations applied successfully')
}

console.log('[vercel-build] Building Next.js app...')
run('npx next build')
require('./postbuild-reminder')
