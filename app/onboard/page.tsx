'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import Spinner from '@/components/Spinner'
import VendorDemographicsSection from '@/components/VendorDemographicsSection'
import { predictTier } from '@/lib/utils'

const DATA_OPTIONS = [
  'Customer PII (names, addresses, SSNs)',
  'Financial Records & Transactions',
  'Trading & Market Data',
  'Employee Data',
  'Authentication & Credentials',
  'Internal Systems Access',
  'No Sensitive Data Access',
]

const SERVICE_TYPES = [
  'Technology / SaaS',
  'Data & Analytics',
  'Cloud Infrastructure',
  'Professional Services',
  'Financial Services',
  'Facilities & Operations',
  'Legal & Compliance',
]

interface SavedVendor {
  id: string
  tier: number
  tierRationale: string
}

export default function OnboardPage() {
  const [form, setForm] = useState({
    companyName: '',
    country: '',
    employeeCount: '',
    contactName: '',
    contactEmail: '',
    serviceType: '',
    serviceDescription: '',
    dataTypes: [] as string[],
    subcontractors: 'no',
    criticality: '',
    substitutability: '',
    natureOfBusiness: '',
    productsServices: '',
    dataCategories: [] as string[],
    dataVolume: '',
    dataRetentionPeriod: '',
    geographicPresence: [] as string[],
    certifications: [] as string[],
    regulatoryBodies: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedVendor, setSavedVendor] = useState<SavedVendor | null>(null)

  const predictedTier = useMemo(
    () => predictTier(form.dataTypes, form.criticality),
    [form.dataTypes, form.criticality]
  )

  const toggleDataType = (label: string) => {
    setForm((prev) => {
      let next = [...prev.dataTypes]
      if (label === 'No Sensitive Data Access') {
        next = next.includes(label) ? [] : [label]
      } else {
        next = next.filter((d) => d !== 'No Sensitive Data Access')
        if (next.includes(label)) {
          next = next.filter((d) => d !== label)
        } else {
          next.push(label)
        }
      }
      return { ...prev, dataTypes: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSavedVendor(null)

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Registration failed')
      setSavedVendor({
        id: data.id,
        tier: data.tier,
        tierRationale: data.tierRationale,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50'
  const labelClass = 'block text-sm font-medium mb-1.5'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Spinner text="Classifying vendor risk tier with AI..." />
      </div>
    )
  }

  if (savedVendor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-card rounded-xl border border-success/30 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl font-semibold mb-4">
            Vendor Registered Successfully
          </h2>
          <div className="mb-4">
            <TierBadge tier={savedVendor.tier} />
          </div>
          <p className="text-secondary text-left bg-navy/50 rounded-lg p-4 mb-6 text-sm leading-relaxed">
            {savedVendor.tierRationale}
          </p>
          <Link
            href={`/assess/${savedVendor.id}`}
            className="inline-block px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Risk Assessment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-heading text-3xl font-bold mb-2">Vendor Registration</h1>
      <p className="text-secondary mb-8">
        Complete the intake form to register a new third-party vendor for risk assessment.
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

        <section className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold border-b border-white/10 pb-3">
            Section 2 — Services
          </h2>
          <div>
            <label className={labelClass}>Type of Service *</label>
            <select required className={inputClass} value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
              <option value="">Select service type</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Service Description *</label>
            <textarea required rows={4} className={inputClass}
              placeholder="Describe what services you will provide"
              value={form.serviceDescription}
              onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })} />
          </div>
        </section>

        <section className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold border-b border-white/10 pb-3">
            Section 3 — Data Access
          </h2>
          <div>
            <label className={labelClass}>What data will this vendor access? *</label>
            <div className="space-y-2 mt-2">
              {DATA_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.dataTypes.includes(opt)}
                    onChange={() => toggleDataType(opt)}
                    className="mt-1 rounded border-white/20" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Will they use sub-contractors? *</label>
            <div className="flex gap-6 mt-2">
              {['yes', 'no'].map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="subcontractors" value={v} required
                    checked={form.subcontractors === v}
                    onChange={() => setForm({ ...form, subcontractors: v })} />
                  <span className="capitalize">{v}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold border-b border-white/10 pb-3">
            Section 4 — Operational
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

        <VendorDemographicsSection
          form={form}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <div className="bg-card rounded-xl border border-primary/30 p-6">
          <p className="text-sm text-secondary mb-2">Live tier preview (client-side estimate)</p>
          <p className="font-heading text-lg">
            Based on your inputs, this vendor will likely be classified as{' '}
            <span className="text-primary font-bold">Tier {predictedTier}</span>
          </p>
        </div>

        <button type="submit"
          className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-colors">
          Submit Vendor Registration
        </button>
      </form>
    </div>
  )
}
