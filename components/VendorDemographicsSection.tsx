'use client'

import {
  CERTIFICATION_OPTIONS,
  DATA_CATEGORY_OPTIONS,
  DATA_RETENTION_OPTIONS,
  DATA_VOLUME_OPTIONS,
  GEOGRAPHIC_OPTIONS,
  REGULATORY_BODY_OPTIONS,
  SERVICE_TYPES,
} from '@/lib/vendor-form-constants'

export interface VendorProfileFormSlice {
  serviceType: string
  natureOfBusiness: string
  productsServices: string
  dataCategories: string[]
  subcontractors: string
  dataVolume: string
  dataRetentionPeriod: string
  geographicPresence: string[]
  certifications: string[]
  regulatoryBodies: string[]
}

interface Props {
  form: VendorProfileFormSlice
  onChange: (patch: Partial<VendorProfileFormSlice>) => void
  inputClass: string
  labelClass: string
  sectionNumber?: number
}

export default function VendorDemographicsSection({
  form,
  onChange,
  inputClass,
  labelClass,
  sectionNumber = 2,
}: Props) {
  const toggleList = (
    field: keyof Pick<
      VendorProfileFormSlice,
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
        Section {sectionNumber} — Vendor Profile & Demographics
      </h2>
      <div>
        <label className={labelClass}>Type of service *</label>
        <select
          required
          className={inputClass}
          value={form.serviceType}
          onChange={(e) => onChange({ serviceType: e.target.value })}
        >
          <option value="">Select service type</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
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
        <label className={labelClass}>Products/services description *</label>
        <textarea
          required
          rows={3}
          className={inputClass}
          placeholder="Describe what services this vendor will provide"
          value={form.productsServices}
          onChange={(e) => onChange({ productsServices: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Types of data accessed/stored *</label>
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
        <label className={labelClass}>Will they use sub-contractors? *</label>
        <div className="flex gap-6 mt-2">
          {['yes', 'no'].map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="subcontractors"
                value={v}
                required
                checked={form.subcontractors === v}
                onChange={() => onChange({ subcontractors: v })}
              />
              <span className="capitalize">{v}</span>
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
