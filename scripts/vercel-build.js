const { execSync } = require('child_process')
require('./prepare-db-env')

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const migrateEnv = { ...process.env, DATABASE_URL: directUrl }

function run(cmd, env = process.env) {
  execSync(cmd, { stdio: 'inherit', env, shell: true })
}

console.log('[vercel-build] Generating Prisma client...')
run('npx prisma generate')

console.log('[vercel-build] Syncing database schema via direct connection...')
try {
  run('npx prisma migrate deploy', migrateEnv)
  console.log('[vercel-build] Migrations applied successfully')
} catch {
  console.log('[vercel-build] migrate deploy failed, falling back to db push...')
  run('npx prisma db push --skip-generate', migrateEnv)
  console.log('[vercel-build] Schema pushed successfully')
}

console.log('[vercel-build] Building Next.js app...')
run('npx next build')
