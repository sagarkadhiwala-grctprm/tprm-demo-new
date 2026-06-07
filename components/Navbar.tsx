import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-heading text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="text-white">Vendor</span>
            <span className="text-primary">Sight</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/onboard"
              className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Register Vendor
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
