'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import { ReportSkeleton } from '@/components/LoadingSkeleton'
import {
  formatDate,
  riskLevelColor,
  scoreBarColor,
} from '@/lib/utils'
import { AssessmentQuestion } from '@/lib/types'
import {
  NormalizedAssessmentFindings,
  gapSeverityColor,
  gapSeverityIconColor,
} from '@/lib/assessment-findings'

interface ReportData {
  id: string
  overallScore: number
  riskLevel: string
  aiNarrative: string
  keyFindings: NormalizedAssessmentFindings
  recommendations: string[]
  completedAt: string
  questions: AssessmentQuestion[]
  responses: Record<string, string>
  scores: Record<string, number>
  vendor: {
    companyName: string
    serviceType: string
    tier: number
    natureOfBusiness?: string
    productsServices?: string
    dataCategories?: string
    dataVolume?: string
    dataRetentionPeriod?: string
    geographicPresence?: string
    certifications?: string
    inherentLikelihood?: number
    inherentImpact?: number
    inherentRiskScore?: number
    inherentRiskRating?: string
  }
  controlEffectivenessScore?: number
  residualLikelihood?: number
  residualImpact?: number
  residualRiskScore?: number
  residualRiskRating?: string
  risksIdentified?: number
  criticalRisks?: number
  highRisks?: number
  mediumRisks?: number
  lowRisks?: number
  approvalStatus?: string
  approvalNotes?: string
  approvedBy?: string
  approvedAt?: string
}

function RiskBadge({ rating }: { rating: string }) {
  const colorClass = riskLevelColor(rating)
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
      {rating}
    </span>
  )
}

function RiskMatrix({
  inherentLikelihood,
  inherentImpact,
  residualLikelihood,
  residualImpact,
}: {
  inherentLikelihood: number
  inherentImpact: number
  residualLikelihood: number
  residualImpact: number
}) {
  const getCellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact
    if (score <= 4) return 'bg-green-500/20'
    if (score <= 9) return 'bg-amber-500/20'
    if (score <= 16) return 'bg-orange-500/20'
    return 'bg-red-500/20'
  }

  const getPosition = (likelihood: number, impact: number) => ({
    row: 5 - likelihood,
    col: impact - 1,
  })

  const inherentPos = getPosition(inherentLikelihood, inherentImpact)
  const residualPos = getPosition(residualLikelihood, residualImpact)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-1 w-full max-w-md mx-auto">
        {Array.from({ length: 25 }).map((_, i) => {
          const row = Math.floor(i / 5)
          const col = i % 5
          const likelihood = 5 - row
          const impact = col + 1
          const score = likelihood * impact
          const isInherent = row === inherentPos.row && col === inherentPos.col
          const isResidual = row === residualPos.row && col === residualPos.col

          return (
            <div
              key={i}
              className={`aspect-square rounded ${getCellColor(likelihood, impact)} flex items-center justify-center text-xs font-medium relative`}
            >
              {isInherent && (
                <div className="absolute w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold z-10">
                  I
                </div>
              )}
              {isResidual && !isInherent && (
                <div className="absolute w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold z-10">
                  R
                </div>
              )}
              {isInherent && isResidual && (
                <div className="absolute w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold z-10">
                  IR
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-6 text-xs text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20" />
          <span>Low (1-4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/20" />
          <span>Medium (5-9)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500/20" />
          <span>High (10-16)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20" />
          <span>Critical (17-25)</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 text-xs text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span>I = Inherent Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-success" />
          <span>R = Residual Risk</span>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const params = useParams()
  const assessmentId = params.assessmentId as string
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`)
        if (!res.ok) throw new Error('Report not found')
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assessmentId])

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: decisionNotes,
          approvedBy: 'Current User',
        }),
      })
      if (!res.ok) throw new Error('Failed to submit decision')
      const updated = await res.json()
      setData((prev) =>
        prev
          ? {
              ...prev,
              approvalStatus: updated.approvalStatus,
              approvalNotes: updated.approvalNotes,
              approvedBy: updated.approvedBy,
              approvedAt: updated.approvedAt,
            }
          : prev
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision')
    } finally {
      setSubmitting(false)
    }
  }

  function safeJsonParse(jsonString: string | null | undefined, fallback: unknown) {
    if (!jsonString) return fallback
    try {
      return JSON.parse(jsonString)
    } catch {
      return fallback
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <ReportSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-danger">
        {error || 'Report not found'}
      </div>
    )
  }

  const parseField = <T,>(val: unknown, fallback: T): T => {
    if (Array.isArray(val)) return val as T
    if (typeof val === 'string') return safeJsonParse(val, fallback)
    return fallback
  }

  const dataCategories = parseField<string[]>(
    data.vendor.dataCategories,
    []
  )
  const geographicPresence = parseField<string[]>(
    data.vendor.geographicPresence,
    []
  )
  const certifications = parseField<string[]>(
    data.vendor.certifications,
    []
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:max-w-none space-y-8">
      {/* SECTION 1 — Executive Header */}
      <header className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <p className="text-primary text-sm font-semibold uppercase tracking-wide mb-2">
              VendorSight Risk Report
            </p>
            <h1 className="font-heading text-3xl font-bold mb-2">
              {data.vendor.companyName}
            </h1>
            <p className="text-secondary mb-4">{data.vendor.serviceType}</p>
            <TierBadge tier={data.vendor.tier} />
            <p className="text-sm text-secondary mt-4">
              Assessment Date: {formatDate(data.completedAt)}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Inherent Risk Card */}
          <div className="bg-navy/50 rounded-xl border border-white/10 p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Inherent Risk</h3>
            <div className="flex items-center gap-4 mb-4">
              <RiskBadge rating={data.vendor.inherentRiskRating || 'Low'} />
              <span className="text-2xl font-bold">{data.vendor.inherentRiskScore || 0}/25</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Likelihood:</span>
                <span className="font-medium">{data.vendor.inherentLikelihood || 0}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Impact:</span>
                <span className="font-medium">{data.vendor.inherentImpact || 0}/5</span>
              </div>
            </div>
          </div>

          {/* Residual Risk Card */}
          <div className="bg-navy/50 rounded-xl border border-white/10 p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Residual Risk</h3>
            <div className="flex items-center gap-4 mb-4">
              <RiskBadge rating={data.residualRiskRating || 'Low'} />
              <span className="text-2xl font-bold">{data.residualRiskScore || 0}/25</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Likelihood:</span>
                <span className="font-medium">{data.residualLikelihood || 0}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Impact:</span>
                <span className="font-medium">{data.residualImpact || 0}/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Reduction Indicator */}
        <div className="mt-6 bg-navy/30 rounded-lg p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-secondary">
              Controls reduced risk from{' '}
              <span className="font-semibold text-white">{data.vendor.inherentRiskRating}</span>
              {' '}to{' '}
              <span className="font-semibold text-white">{data.residualRiskRating}</span>
            </p>
          </div>
          {(data.vendor.inherentRiskScore || 0) > (data.residualRiskScore || 0) && (
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </header>

      {/* SECTION 2 — Risk Matrix Position */}
      <section className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold mb-6">Risk Matrix Position</h2>
        <RiskMatrix
          inherentLikelihood={data.vendor.inherentLikelihood || 1}
          inherentImpact={data.vendor.inherentImpact || 1}
          residualLikelihood={data.residualLikelihood || 1}
          residualImpact={data.residualImpact || 1}
        />
      </section>

      {/* SECTION 3 — Vendor Demographics */}
      <section className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold mb-6">Vendor Demographics</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Nature of Business</h3>
            <p className="text-white">{data.vendor.natureOfBusiness || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Products/Services</h3>
            <p className="text-white">{data.vendor.productsServices || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Data Categories</h3>
            <div className="flex flex-wrap gap-2">
              {dataCategories.length > 0 ? (
                dataCategories.map((cat: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded bg-primary/20 text-primary text-xs">
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-secondary text-sm">Not specified</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Data Volume & Retention</h3>
            <p className="text-white text-sm">
              {data.vendor.dataVolume || 'Not specified'} · {data.vendor.dataRetentionPeriod || 'Not specified'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Geographic Presence</h3>
            <div className="flex flex-wrap gap-2">
              {geographicPresence.length > 0 ? (
                geographicPresence.map((region: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded bg-white/10 text-white text-xs">
                    {region}
                  </span>
                ))
              ) : (
                <span className="text-secondary text-sm">Not specified</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Security Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {certifications.length > 0 ? (
                certifications.map((cert: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded bg-success/20 text-success text-xs">
                    {cert}
                  </span>
                ))
              ) : (
                <span className="text-secondary text-sm">None specified</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Risk Summary Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-danger/30 p-5">
          <p className="text-danger text-sm mb-1">Total Risks Identified</p>
          <p className="text-3xl font-bold text-danger">{data.risksIdentified || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-warning/30 p-5">
          <p className="text-warning text-sm mb-1">Critical/High Risks</p>
          <p className="text-3xl font-bold text-warning">{(data.criticalRisks || 0) + (data.highRisks || 0)}</p>
        </div>
        <div className="bg-card rounded-xl border border-primary/30 p-5">
          <p className="text-primary text-sm mb-1">Control Effectiveness</p>
          <p className="text-3xl font-bold text-primary">{data.controlEffectivenessScore || 0}/100</p>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-5">
          <p className="text-secondary text-sm mb-1">Overall Risk Level</p>
          <RiskBadge rating={data.riskLevel} />
        </div>
      </section>

      {/* SECTION 5 — AI Executive Summary */}
      <section className="bg-card rounded-xl border border-primary/20 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-20">
          <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7.001 7.001 0 0112 22a7 7 0 01-6.93-6H4a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm0 4a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          AI Executive Summary
        </h2>
        <p className="text-[#F9FAFB]/90 leading-relaxed text-base sm:text-lg">
          {data.aiNarrative}
        </p>
      </section>

      {/* SECTION 6 — Control Strengths & Risk Findings */}
      {(data.keyFindings.strengths.length > 0 ||
        data.keyFindings.gaps.length > 0) && (
        <div className="space-y-6">
          {data.keyFindings.strengths.length > 0 && (
            <section className="bg-card rounded-xl border border-success/20 p-6 sm:p-8">
              <h2 className="font-heading text-xl font-semibold mb-4">
                Control Strengths
              </h2>
              <ul className="space-y-3">
                {data.keyFindings.strengths.map((strength, i) => (
                  <li key={i} className="flex gap-3 text-sm sm:text-base">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-white/90">{strength}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.keyFindings.gaps.length > 0 && (
            <section className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
              <h2 className="font-heading text-xl font-semibold mb-4">
                Risk Findings & Gaps
              </h2>
              <ul className="space-y-3">
                {data.keyFindings.gaps.map((finding, i) => (
                  <li key={i} className="flex gap-3 text-sm sm:text-base">
                    <svg
                      className={`w-5 h-5 shrink-0 mt-0.5 ${gapSeverityIconColor(finding.severity)}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className={gapSeverityColor(finding.severity)}>
                      {finding.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* SECTION 7 — Recommendations */}
      <section className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold mb-4">Recommendations</h2>
        <ol className="space-y-4">
          {data.recommendations.map((rec, i) => {
            let priority = 'Low'
            if (i === 0) priority = 'High'
            else if (i <= 2) priority = 'Medium'

            const priorityColor = priority === 'High' ? 'bg-danger/20 text-danger' : priority === 'Medium' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'

            return (
              <li key={i} className="flex gap-4 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded border border-white/30 shrink-0 mt-0.5">
                  <span className="w-3 h-3 rounded-sm bg-white/10" />
                </span>
                <span className="flex-1">
                  <span className="text-primary font-semibold mr-2">{i + 1}.</span>
                  {rec}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${priorityColor}`}>
                    {priority} Priority
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      {/* SECTION 8 — Question-by-Question Analysis */}
      <section className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold mb-6">
          Question-by-Question Analysis
        </h2>
        <div className="space-y-8">
          {data.questions.map((q) => {
            const score = data.scores[q.id] ?? 0
            return (
              <div key={q.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
                    {q.category}
                  </span>
                </div>
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-secondary text-sm mb-4 bg-navy/50 rounded-lg p-3">
                  {data.responses[q.id] || '(No response)'}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{score}/100</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 9 — Risk Owner Decision */}
      <section className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold mb-4">Risk Owner Decision</h2>
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            data.approvalStatus === 'approved' ? 'bg-success/20 text-success' :
            data.approvalStatus === 'rejected' ? 'bg-danger/20 text-danger' :
            'bg-warning/20 text-warning'
          }`}>
            {data.approvalStatus ? data.approvalStatus.charAt(0).toUpperCase() + data.approvalStatus.slice(1) : 'Pending'}
          </span>
        </div>

        {data.approvalStatus === 'pending' ? (
          <div className="space-y-4">
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Add decision notes..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-4">
              <button
                onClick={() => handleDecision('approved')}
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-success text-white font-semibold hover:bg-success/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Approve'}
              </button>
              <button
                onClick={() => handleDecision('rejected')}
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-danger text-white font-semibold hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Reject'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p><span className="text-secondary">Decision:</span> {data.approvalStatus}</p>
            <p><span className="text-secondary">By:</span> {data.approvedBy}</p>
            <p><span className="text-secondary">At:</span> {data.approvedAt ? formatDate(data.approvedAt) : 'N/A'}</p>
            {data.approvalNotes && (
              <p><span className="text-secondary">Notes:</span> {data.approvalNotes}</p>
            )}
          </div>
        )}
      </section>

      <div className="no-print flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
        >
          Download Report
        </button>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-xl border border-white/20 text-center hover:bg-white/5 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
