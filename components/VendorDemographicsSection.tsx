'use client'

import {
  CERTIFICATION_OPTIONS,
  DATA_CATEGORY_OPTIONS,
  DATA_RETENTION_OPTIONS,
  DATA_VOLUME_OPTIONS,
  GEOGRAPHIC_OPTIONS,
  REGULATORY_BODY_OPTIONS,
} from '@/lib/vendor-form-constants'

export interface DemographicsFormSlice {
  natureOfBusiness: string
  productsServices: string
  dataCategories: string[]
  dataVolume: string
  dataRetentionPeriod: string
  geographicPresence: string[]
  certifications: string[]
  regulatoryBodies: string[]
}

interface Props {
  form: DemographicsFormSlice
  onChange: (patch: Partial<DemographicsFormSlice>) => void
  inputClass: string
  labelClass: string
}

export default function VendorDemographicsSection({
  form,
  onChange,
  inputClass,
  labelClass,
}: Props) {
  const toggleList = (
    field: keyof Pick<
      DemographicsFormSlice,
      'dataCategories' | 'geographicPresence' | 'certifications' | 'regulatoryBodies'
    >,
    label: string,
    exclusive?: string
  ) => {
    const current = form[field] as string[]
    if (exclusive && label === exclusive) {
      onChange({ [field]: current.includes(label) ? [] : [label] })
      return
    }
    let next = current.filter((d) => d !== exclusive)
    if (next.includes(label)) {
      next = next.filter((d) => d !== label)
    } else {
      next = [...next, label]
    }
    onChange({ [field]: next })
  }

  return (
    <section className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
      <h2 className="font-heading text-xl font-semibold border-b border-white/10 pb-3">
        Section 5 — Vendor Profile & Demographics
      </h2>
      <div>
        <label className={labelClass}>Nature of business</label>
        <input
          className={inputClass}
          value={form.natureOfBusiness}
          placeholder="e.g. Cloud Infrastructure Provider"
          onChange={(e) => onChange({ natureOfBusiness: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Products/Services description</label>
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Detailed description of products/services"
          value={form.productsServices}
          onChange={(e) => onChange({ productsServices: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Types of data accessed/stored</label>
        <div className="space-y-2 mt-2">
          {DATA_CATEGORY_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.dataCategories.includes(opt)}
                onChange={() =>
                  toggleList('dataCategories', opt, 'No Sensitive Data')
                }
                className="mt-1 rounded border-white/20"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Data volume</label>
        <select
          className={inputClass}
          value={form.dataVolume}
          onChange={(e) => onChange({ dataVolume: e.target.value })}
        >
          <option value="">Select volume</option>
          {DATA_VOLUME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Data retention period</label>
        <select
          className={inputClass}
          value={form.dataRetentionPeriod}
          onChange={(e) => onChange({ dataRetentionPeriod: e.target.value })}
        >
          <option value="">Select retention period</option>
          {DATA_RETENTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Geographic presence</label>
        <div className="space-y-2 mt-2">
          {GEOGRAPHIC_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.geographicPresence.includes(opt)}
                onChange={() => toggleList('geographicPresence', opt)}
                className="mt-1 rounded border-white/20"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Security certifications held</label>
        <div className="space-y-2 mt-2">
          {CERTIFICATION_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.certifications.includes(opt)}
                onChange={() =>
                  toggleList('certifications', opt, 'None of the above')
                }
                className="mt-1 rounded border-white/20"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Regulatory bodies (optional)</label>
        <div className="space-y-2 mt-2">
          {REGULATORY_BODY_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.regulatoryBodies.includes(opt)}
                onChange={() => toggleList('regulatoryBodies', opt, 'None')}
                className="mt-1 rounded border-white/20"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
