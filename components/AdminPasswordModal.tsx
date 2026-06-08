'use client'

import { useEffect, useState } from 'react'

interface AdminPasswordModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<boolean>
  confirmLabel?: string
  confirmDanger?: boolean
  submitting?: boolean
}

export default function AdminPasswordModal({
  open,
  onClose,
  onSubmit,
  confirmLabel = 'Continue',
  confirmDanger = false,
  submitting = false,
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPassword('')
      setError('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = await onSubmit(password)
    if (!ok) {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-white/10 p-6 shadow-xl">
        <h2 className="font-heading text-xl font-semibold mb-4">
          Admin Access Required
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              required
              className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !password.trim()}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
                confirmDanger
                  ? 'bg-danger hover:bg-danger/90'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {submitting ? 'Verifying…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
