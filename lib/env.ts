const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'DATABASE_URL',
  'ADMIN_PASSWORD',
] as const

const isLocalNextBuild =
  process.env.NEXT_PHASE === 'phase-production-build' && !process.env.VERCEL

if (!isLocalNextBuild) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(
        `Missing required environment variable: ${envVar}. Add it to .env.local and Vercel environment variables.`
      )
    }
  }
}

export const env = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? '',
} as const
