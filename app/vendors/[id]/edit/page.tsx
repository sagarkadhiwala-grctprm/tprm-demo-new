'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Spinner from '@/components/Spinner'
import AdminPasswordModal from '@/components/AdminPasswordModal'
import VendorDemographicsSection from '@/components/VendorDemographicsSection'
import { safeJsonParse } from '@/lib/json'
import {
  getStoredAdminPassword,
  storeAdminPassword,
  verifyAdminPassword,
} from '@/lib/admin-auth-client'

export default function EditVendorPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.id as string

  const [form, setForm] = useState({
    companyName: '',
    country: '',
    employeeCount: '',
    contactName: '',
    contactEmail: '',
    serviceType: '',
    natureOfBusiness: '',
    productsServices: '',
    dataCategories: [] as string[],
    subcontractors: 'no',
    dataVolume: '',
    dataRetentionPeriod: '',
    geographicPresence: [] as string[],
    certifications: [] as string[],
    regulatoryBodies: [] as string[],
    criticality: '',
    substitutability: '',
  })

  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const loadVendor = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/vendors/${vendorId}`)
      if (!res.ok) throw new Error('Failed to load vendor')
      const vendor = await res.json()

      const dataCategories = safeJsonParse<string[]>(vendor.dataCategories, [])
      const geographicPresence = safeJsonParse<string[]>(vendor.geographicPresence, [])
      const certifications = safeJsonParse<string[]>(vendor.certifications, [])
      const regulatoryBodies = safeJsonParse<string[]>(vendor.regulatoryBodies, [])

      const legacyDataTypes = vendor.dataTypes
        ? vendor.dataTypes.split(', ').filter(Boolean)
        : []

      setForm({
        companyName: vendor.companyName || '',
        country: vendor.country || '',
        employeeCount: vendor.employeeCount || '',
        contactName: vendor.contactName || '',
        contactEmail: vendor.contactEmail || '',
        serviceType: vendor.serviceType || '',
        natureOfBusiness: vendor.natureOfBusiness || '',
        productsServices: vendor.productsServices || '',
        dataCategories:
          dataCategories.length > 0 ? dataCategories : legacyDataTypes,
        subcontractors: 'no',
        criticality: '',
        substitutability: '',
        dataVolume: vendor.dataVolume || '',
        dataRetentionPeriod: vendor.dataRetentionPeriod || '',
        geographicPresence,
        certifications,
        regulatoryBodies,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor')
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    async function checkAuth() {
      const stored = getStoredAdminPassword()
      if (stored && (await verifyAdminPassword(stored))) {
        setAuthenticated(true)
        setShowAuthModal(false)
      } else {
        setShowAuthModal(true)
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadVendor()
    }
  }, [authenticated, loadVendor])

  const handleAuthSubmit = async (password: string): Promise<boolean> => {
    setAuthSubmitting(true)
    try {
      const ok = await verifyAdminPassword(password)
      if (!ok) return false
      storeAdminPassword(password)
      setAuthenticated(true)
      setShowAuthModal(false)
      return true
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.dataCategories.length === 0) {
      setError('Please select at least one data category in Section 2.')
      return
    }

    const adminPassword = getStoredAdminPassword()
    if (!adminPassword) {
      setShowAuthModal(true)
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 401) {
        setShowAuthModal(true)
        throw new Error('Session expired. Please enter the admin password again.')
      }
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50'
  const labelClass = 'block text-sm font-medium mb-1.5'

  if (checkingAuth) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Spinner text="Checking admin access..." />
      </div>
    )
  }

  if (loading && authenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Spinner text="Loading vendor data..." />
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-card rounded-xl border border-success/30 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl font-semibold mb-4">
            Vendor Updated Successfully
          </h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-block px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <AdminPasswordModal
        open={showAuthModal}
        onClose={() => router.push('/dashboard')}
        onSubmit={handleAuthSubmit}
        confirmLabel="Continue"
        submitting={authSubmitting}
      />

      {authenticated && (
        <>
          <h1 className="font-heading text-3xl font-bold mb-2">Edit Vendor</h1>
          <p className="text-secondary mb-8">
            Update vendor information and risk profile.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
              <h2 className="font-heading text-xl font-semibold border-b border-white/10 pb-3">
                Section 1 — Company Info
              </h2>
              <div>
                <label className={labelClass}>Company Name *</label>
                <input required className={inputClass} value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Country *</label>
                <input required className={inputClass} value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Employee Count *</label>
                <select required className={inputClass} value={form.employeeCount}
                  onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}>
                  <option value="">Select range</option>
                  <option value="1-50">1-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-1000">201-1000</option>
                  <option value="1001-5000">1001-5000</option>
                  <option value="5000+">5000+</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Contact Name *</label>
                <input required className={inputClass} value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Contact Email *</label>
                <input required type="email" className={inputClass} value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
            </section>

            <VendorDemographicsSection
              form={form}
              onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              inputClass={inputClass}
              labelClass={labelClass}
              sectionNumber={2}
            />

            <section className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
              <h2 className="font-heading text-xl font-semibold border-b border-white/10 pb-3">
                Section 3 — Operational
              </h2>
              <div>
                <label className={labelClass}>Business criticality if vendor is unavailable *</label>
                <select required className={inputClass} value={form.criticality}
                  onChange={(e) => setForm({ ...form, criticality: e.target.value })}>
                  <option value="">Select criticality</option>
                  <option value="Critical — operations would stop">Critical — operations would stop</option>
                  <option value="High — significant degradation">High — significant degradation</option>
                  <option value="Medium — workaround available">Medium — workaround available</option>
                  <option value="Low — minimal impact">Low — minimal impact</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Are alternative vendors available? *</label>
                <select required className={inputClass} value={form.substitutability}
                  onChange={(e) => setForm({ ...form, substitutability: e.target.value })}>
                  <option value="">Select substitutability</option>
                  <option value="No — sole source provider">No — sole source provider</option>
                  <option value="Difficult — 6+ months to replace">Difficult — 6+ months to replace</option>
                  <option value="Possible — 1-3 months to replace">Possible — 1-3 months to replace</option>
                  <option value="Easy — can switch quickly">Easy — can switch quickly</option>
                </select>
              </div>
            </section>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 rounded-xl bg-navy border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
