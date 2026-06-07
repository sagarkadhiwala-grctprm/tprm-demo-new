import { GITHUB_URL, LINKEDIN_URL, PRODUCT_NAME } from '@/lib/branding'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-card/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-secondary">
        <p className="text-xs sm:text-sm">© 2025 {PRODUCT_NAME}</p>
        <p className="text-xs opacity-50 text-center">
          Built for demonstration purposes only. Not a production compliance tool.
        </p>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built by Sagar Kadhiwala
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
