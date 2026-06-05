'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DOCUMENT_TYPES,
  DocumentAnalysisResult,
  VendorDocumentResponse,
} from '@/lib/documents'

const RISK_COLORS: Record<string, string> = {
  Critical: 'text-danger border-danger/40 bg-danger/10',
  High: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
  Medium: 'text-warning border-warning/40 bg-warning/10',
  Low: 'text-success border-success/40 bg-success/10',
}

const STATUS_LABELS: Record<string, string> = {
  uploaded: 'Ready for AI review',
  analyzing: 'Analyzing…',
  analyzed: 'Reviewed',
  failed: 'Analysis failed',
}

function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RISK_COLORS[level] || 'text-secondary border-white/20'}`}
    >
      {level}
    </span>
  )
}

function DocumentAnalysisCard({ analysis }: { analysis: DocumentAnalysisResult }) {
  const complianceChecks = analysis.complianceChecks ?? []
  const riskFlags = analysis.riskFlags ?? []

  return (
    <div className="mt-3 space-y-3 text-sm border-t border-white/10 pt-3">
      <p className="text-secondary leading-relaxed">{analysis.summary}</p>
      {complianceChecks.length > 0 && (
        <div>
          <p className="font-medium text-xs uppercase text-secondary mb-2">
            Compliance checks
          </p>
          <ul className="space-y-1.5">
            {complianceChecks.map((c, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded uppercase font-semibold ${
                    c.status === 'pass'
                      ? 'bg-success/20 text-success'
                      : c.status === 'fail'
                        ? 'bg-danger/20 text-danger'
                        : c.status === 'warning'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-white/10 text-secondary'
                  }`}
                >
                  {c.status}
                </span>
                <span>
                  <strong>{c.check}:</strong> {c.details}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {riskFlags.length > 0 && (
        <div>
          <p className="font-medium text-xs uppercase text-danger mb-2">
            Risk flags
          </p>
          <ul className="space-y-2">
            {riskFlags.map((f, i) => (
              <li
                key={i}
                className="p-2 rounded-lg bg-danger/5 border border-danger/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <RiskBadge level={f.severity} />
                  <span className="text-xs text-secondary">{f.category}</span>
                </div>
                <p className="font-medium">{f.finding}</p>
                <p className="text-secondary text-xs mt-1">{f.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface DocumentUploadPanelProps {
  vendorId: string
  onDocumentsReady?: (hasAnalyzed: boolean) => void
  compact?: boolean
}

export default function DocumentUploadPanel({
  vendorId,
  onDocumentsReady,
  compact = false,
}: DocumentUploadPanelProps) {
  const [documents, setDocuments] = useState<VendorDocumentResponse[]>([])
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const loadDocuments = useCallback(async () => {
    const res = await fetch(`/api/vendors/${vendorId}/documents`)
    if (res.ok) {
      const data = await res.json()
      setDocuments(data)
      onDocumentsReady?.(data.some((d: VendorDocumentResponse) => d.status === 'analyzed'))
    }
  }, [vendorId, onDocumentsReady])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleUpload = async () => {
    if (!file) {
      setError('Select a file to upload')
      return
    }
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('vendorId', vendorId)
      formData.append('documentType', documentType)
      formData.append('file', file)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.details
            ? `${data.error}: ${data.details}`
            : data.error || 'Upload failed'
        )
      }

      setFile(null)
      const input = document.getElementById(
        `doc-file-${vendorId}`
      ) as HTMLInputElement
      if (input) input.value = ''
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async (documentId?: string) => {
    setError('')
    setAnalyzing(true)
    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, documentId }),
      })
      const data = await res.json()

      if (!res.ok) {
        const detail =
          Array.isArray(data.details) && data.details.length
            ? data.details.join(' · ')
            : data.details || data.error
        throw new Error(detail || 'Analysis failed')
      }

      if (data.errors?.length) {
        setError(
          `${data.successCount} document(s) analyzed. Failed: ${data.errors.join(' · ')}`
        )
      }

      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      await loadDocuments()
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    await loadDocuments()
  }

  const pendingCount = documents.filter(
    (d) => d.status === 'uploaded' || d.status === 'failed'
  ).length

  return (
    <section
      className={`bg-card rounded-xl border border-white/10 ${compact ? 'p-4' : 'p-6'} space-y-4`}
    >
      <div>
        <h2 className="font-heading text-xl font-semibold">
          Compliance Documents
        </h2>
        <p className="text-secondary text-sm mt-1">
          Upload SOC 2, HITRUST, ISO 27001, pen test reports, policies, and
          related artifacts. AI extracts evidence and flags risks — e.g. policies
          must be signed by an authorized signatory and reviewed within the last
          12 months.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Document type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-sm"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            File (PDF, TXT, MD — max 4MB)
          </label>
          <input
            id={`doc-file-${vendorId}`}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm file:cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Uploading…' : 'Upload document'}
        </button>
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg border border-primary/50 text-primary text-sm font-medium hover:bg-primary/10 disabled:opacity-50"
          >
            {analyzing
              ? 'AI reviewing documents…'
              : `Analyze all with AI (${pendingCount})`}
          </button>
        )}
      </div>

      {documents.length > 0 && (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="p-4 rounded-lg bg-navy/60 border border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{doc.fileName}</p>
                  <p className="text-xs text-secondary mt-0.5">
                    {doc.documentType} · {(doc.fileSize / 1024).toFixed(1)} KB ·{' '}
                    {STATUS_LABELS[doc.status] || doc.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.overallRisk && <RiskBadge level={doc.overallRisk} />}
                  {(doc.status === 'uploaded' || doc.status === 'failed') && (
                    <button
                      type="button"
                      onClick={() => handleAnalyze(doc.id)}
                      disabled={analyzing}
                      className="text-xs text-primary hover:underline"
                    >
                      Analyze
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs text-secondary hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {doc.status === 'failed' && !doc.aiAnalysis && (
                <p className="mt-2 text-xs text-danger">
                  Analysis failed — click Analyze to retry. Check that
                  ANTHROPIC_API_KEY is set if errors persist.
                </p>
              )}
              {doc.aiAnalysis && (
                <DocumentAnalysisCard analysis={doc.aiAnalysis} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
