# Security Checklist for VendorSight

## Before Going Public — Verify These Manually

### Supabase (CRITICAL)
- [ ] Row Level Security (RLS) enabled on Vendor table
- [ ] Row Level Security (RLS) enabled on Assessment table
- [ ] No Supabase service key exposed in frontend code
- [ ] Using connection pooling URL for Vercel deployment

### Environment Variables
- [ ] ANTHROPIC_API_KEY only in .env.local and Vercel (never in code)
- [ ] DATABASE_URL only in .env.local and Vercel (never in code)
- [ ] ADMIN_PASSWORD only in .env.local and Vercel (never in code)
- [ ] .env.local is in .gitignore

### GitHub
- [ ] No secrets in git commit history
- [ ] Repository does not contain any .env files
- [ ] Dependabot alerts enabled (GitHub → Settings → Security)

### Vercel
- [ ] All environment variables added to Vercel dashboard
- [ ] Preview deployments also have environment variables set
