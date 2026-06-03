'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { formatDate } from '@/lib/utils'
import { VendorWithAssessment } from '@/lib/types'

type SortKey =
  | 'companyName'
  | 'serviceType'
  | 'tier'
  | 'overallScore'
  | 'status'
  | 'createdAt'

export default function DashboardPage() {
  const [vendors, setVendors] = useState<VendorWithAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendors')
        if (!res.ok) throw new Error('Failed to load')
        setVendors(await res.json())
      } catch {
        setVendors([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => ({
    total: vendors.length,
    tier1: vendors.filter((v) => v.tier === 1).length,
    tier2: vendors.filter((v) => v.tier === 2).length,
    tier3: vendors.filter((v) => v.tier === 3).length,
  }), [vendors])

  const filtered = useMemo(() => {
    let list = vendors.filter((v) =>
      v.companyName.toLowerCase().includes(search.toLowerCase())
    )

    list = [...list].sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortKey) {
        case 'companyName':
          aVal = a.companyName
          bVal = b.companyName
          break
        case 'serviceType':
          aVal = a.serviceType
          bVal = b.serviceType
          break
        case 'tier':
          aVal = a.tier
          bVal = b.tier
          break
        case 'overallScore':
          aVal = a.latestAssessment?.overallScore ?? -1
          bVal = b.latestAssessment?.overallScore ?? -1
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
      }

      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })

    return list
  }, [vendors, search, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const SortHeader = ({
    label,
    col,
  }: {
    label: string
    col: SortKey
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
      onClick={() => handleSort(col)}
    >
      {label}
      {sortKey === col && (sortAsc ? ' ↑' : ' ↓')}
    </th>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Risk Dashboard</h1>
          <p className="text-secondary mt-1">
            Monitor vendor risk tiers and assessment status
          </p>
        </div>
        <Link
          href="/onboard"
          className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          + Register Vendor
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-white/10 p-5">
          <p className="text-secondary text-sm mb-1">Total Vendors</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card rounded-xl border border-danger/30 p-5">
          <p className="text-danger text-sm mb-1">Tier 1 — Critical</p>
          <p className="text-3xl font-bold text-danger">{stats.tier1}</p>
        </div>
        <div className="bg-card rounded-xl border border-warning/30 p-5">
          <p className="text-warning text-sm mb-1">Tier 2 — Moderate</p>
          <p className="text-3xl font-bold text-warning">{stats.tier2}</p>
        </div>
        <div className="bg-card rounded-xl border border-success/30 p-5">
          <p className="text-success text-sm mb-1">Tier 3 — Low Risk</p>
          <p className="text-3xl font-bold text-success">{stats.tier3}</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 rounded-lg bg-card border border-white/10 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-navy/50">
                <tr>
                  <SortHeader label="Company Name" col="companyName" />
                  <SortHeader label="Service Type" col="serviceType" />
                  <SortHeader label="Tier" col="tier" />
                  <SortHeader label="Risk Score" col="overallScore" />
                  <SortHeader label="Status" col="status" />
                  <SortHeader label="Date Registered" col="createdAt" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-secondary">
                      No vendors found.{' '}
                      <Link href="/onboard" className="text-primary hover:underline">
                        Register your first vendor
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        {vendor.companyName}
                      </td>
                      <td className="px-4 py-4 text-secondary text-sm whitespace-nowrap">
                        {vendor.serviceType}
                      </td>
                      <td className="px-4 py-4">
                        <TierBadge tier={vendor.tier} />
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {vendor.latestAssessment
                          ? `${vendor.latestAssessment.overallScore}/100`
                          : '—'}
                      </td>
                      <td className="px-4 py-4">
                        {vendor.status === 'completed' ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-success/20 text-success">
                            Assessed
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning">
                            Awaiting Assessment
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-secondary text-sm whitespace-nowrap">
                        {formatDate(vendor.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        {vendor.status === 'completed' && vendor.latestAssessment ? (
                          <Link
                            href={`/report/${vendor.latestAssessment.id}`}
                            className="text-sm text-primary hover:underline whitespace-nowrap"
                          >
                            View Report
                          </Link>
                        ) : (
                          <Link
                            href={`/assess/${vendor.id}`}
                            className="text-sm text-primary hover:underline whitespace-nowrap"
                          >
                            Start Assessment
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
