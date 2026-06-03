'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TierBadge from '@/components/TierBadge'
import Spinner from '@/components/Spinner'
import { CardSkeleton } from '@/components/LoadingSkeleton'
import { AssessmentQuestion } from '@/lib/types'

interface Vendor {
  id: string
  companyName: string
  serviceType: string
  dataTypes: string
  tier: number
}

const LOADING_STEPS = [
  'Analyzing responses...',
  'Calculating risk score...',
  'Generating risk report...',
]

export default function AssessPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadingVendor, setLoadingVendor] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')

  const loadVendorAndQuestions = useCallback(async () => {
    setLoadingVendor(true)
    setError('')
    try {
      const vendorRes = await fetch(`/api/vendors/${vendorId}`)
      if (!vendorRes.ok) throw new Error('Vendor not found')
      const vendorData = await vendorRes.json()
      setVendor(vendorData)

      setLoadingQuestions(true)
      const qRes = await fetch('/api/assess/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: vendorData.companyName,
          serviceType: vendorData.serviceType,
          dataTypes: vendorData.dataTypes,
          tier: vendorData.tier,
        }),
      })
      if (!qRes.ok) {
        const err = await qRes.json()
        throw new Error(err.error || 'Failed to generate questions')
      }
      const qData = await qRes.json()
      setQuestions(qData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment')
    } finally {
      setLoadingVendor(false)
      setLoadingQuestions(false)
    }
  }, [vendorId])

  useEffect(() => {
    loadVendorAndQuestions()
  }, [loadVendorAndQuestions])

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  const handleSubmit = async () => {
    setSubmitting(true)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 2000)

    try {
      const res = await fetch('/api/assess/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, questions, responses }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scoring failed')
      router.push(`/report/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
      setSubmitting(false)
    } finally {
      clearInterval(stepInterval)
    }
  }

  const goNext = () => {
    if (isLast) {
      handleSubmit()
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  if (loadingVendor || loadingQuestions) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        {vendor ? (
          <Spinner
            text={`Generating tailored assessment questions for ${vendor.companyName}...`}
          />
        ) : (
          <div className="space-y-4">
            <CardSkeleton />
            <Spinner text="Loading vendor profile..." />
          </div>
        )}
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Spinner text={LOADING_STEPS[loadingStep]} />
        <div className="flex justify-center gap-2 mt-6">
          {LOADING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i <= loadingStep ? 'bg-primary' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (error && !questions.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={loadVendorAndQuestions} className="text-primary hover:underline">
          Retry
        </button>
      </div>
    )
  }

  if (!currentQuestion || !vendor) return null

  const progress = ((currentIndex + 1) / questions.length) * 100
  const categoryColors: Record<string, string> = {
    Security: 'bg-primary/20 text-primary',
    Compliance: 'bg-purple-500/20 text-purple-300',
    Financial: 'bg-warning/20 text-warning',
    Operational: 'bg-success/20 text-success',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">{vendor.companyName}</h1>
          <p className="text-secondary text-sm">{vendor.serviceType}</p>
        </div>
        <TierBadge tier={vendor.tier} />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between text-sm text-secondary mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-white/10 p-6 sm:p-8">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
            categoryColors[currentQuestion.category] || 'bg-white/10'
          }`}
        >
          {currentQuestion.category}
        </span>
        <h2 className="font-heading text-xl font-semibold mb-6 leading-relaxed">
          {currentQuestion.question}
        </h2>
        <textarea
          rows={8}
          className="w-full px-4 py-3 rounded-lg bg-navy border border-white/10 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          placeholder="Enter your detailed response..."
          value={responses[currentQuestion.id] || ''}
          onChange={(e) =>
            setResponses({ ...responses, [currentQuestion.id]: e.target.value })
          }
        />
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!responses[currentQuestion.id]?.trim()}
            className="flex-1 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLast ? 'Submit Assessment' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
