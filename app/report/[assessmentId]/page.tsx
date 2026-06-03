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

interface ReportData {
  id: string
  overallScore: number
  riskLevel: string
  aiNarrative: string
  keyFindings: string[]
  recommendations: string[]
  completedAt: string
  questions: AssessmentQuestion[]
  responses: Record<string, string>
  scores: Record<string, number>
  vendor: {
    companyName: string
    serviceType: string
    tier: number
  }
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference
  const color =
    score <= 40 ? '#EF4444' : score <= 70 ? '#F59E0B' : '#10B981'

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-secondary">Risk Score</span>
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <ReportSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-danger">
        {error || 'Report not found'}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:max-w-none">
      <header className="print-card bg-card rounded-xl border border-white/10 p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-bold mb-2">
              {data.vendor.companyName}
            </h1>
            <p className="text-secondary mb-4">{data.vendor.serviceType}</p>
            <TierBadge tier={data.vendor.tier} />
            <p className="text-sm text-secondary mt-4">
              Assessment Date: {formatDate(data.completedAt)}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <ScoreGauge score={data.overallScore} />
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${riskLevelColor(data.riskLevel)}`}
            >
              {data.riskLevel} Risk
            </span>
          </div>
        </div>
      </header>

      <section className="print-card bg-card rounded-xl border border-primary/20 p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-20">
          <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7.001 7.001 0 0112 22a7 7 0 01-6.93-6H4a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm0 4a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          AI Risk Assessment Summary
        </h2>
        <p className="text-[#F9FAFB]/90 leading-relaxed text-base sm:text-lg">
          {data.aiNarrative}
        </p>
      </section>

      <section className="print-card bg-card rounded-xl border border-white/10 p-6 sm:p-8 mb-8">
        <h2 className="font-heading text-xl font-semibold mb-4">Key Findings</h2>
        <ul className="space-y-3">
          {data.keyFindings.map((finding, i) => (
            <li key={i} className="flex gap-3 text-sm sm:text-base">
              <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[#F9FAFB]/90">{finding}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="print-card bg-card rounded-xl border border-white/10 p-6 sm:p-8 mb-8">
        <h2 className="font-heading text-xl font-semibold mb-4">Recommended Actions</h2>
        <ol className="space-y-4">
          {data.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="flex items-center justify-center w-6 h-6 rounded border border-white/30 shrink-0 mt-0.5">
                <span className="w-3 h-3 rounded-sm bg-white/10" />
              </span>
              <span className="flex-1">
                <span className="text-primary font-semibold mr-2">{i + 1}.</span>
                {rec}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="print-card bg-card rounded-xl border border-white/10 p-6 sm:p-8 mb-8">
        <h2 className="font-heading text-xl font-semibold mb-6">
          Detailed Response Analysis
        </h2>
        <div className="space-y-8">
          {data.questions.map((q) => {
            const score = data.scores[q.id] ?? 0
            return (
              <div key={q.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
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
        <Link
          href="/onboard"
          className="px-6 py-3 rounded-xl border border-white/20 text-center hover:bg-white/5 transition-colors"
        >
          Register Another Vendor
        </Link>
      </div>
    </div>
  )
}
