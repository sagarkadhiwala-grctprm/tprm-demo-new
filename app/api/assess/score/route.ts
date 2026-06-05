import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { calculateResidualRisk } from '@/lib/inherent-risk'
import {
  buildDocumentContextForPrompt,
  parseDocumentAnalysis,
} from '@/lib/documents'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, questions, responses } = body

    if (!vendorId || !questions || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const qaBlock = questions
      .map((q: { id: string; question: string; category: string }) => {
        const answer = responses[q.id] || '(no answer provided)'
        return `Question ID: ${q.id}\nQuestion: ${q.question}\nCategory: ${q.category}\nAnswer: ${answer}`
      })
      .join('\n\n---\n\n')

    const questionIds = questions.map((q: { id: string }) => q.id).join(', ')

    const analyzedDocs = await prisma.vendorDocument.findMany({
      where: { vendorId, status: 'analyzed' },
      select: {
        fileName: true,
        documentType: true,
        aiAnalysis: true,
        overallRisk: true,
      },
    })

    const documentContext = buildDocumentContextForPrompt(analyzedDocs)

    const allDocFlags = analyzedDocs.flatMap((d) => {
      const a = parseDocumentAnalysis(d.aiAnalysis)
      return a?.riskFlags || []
    })

    const documentAnalysisSnapshot = {
      documentCount: analyzedDocs.length,
      aggregateDocumentRisk:
        analyzedDocs.reduce((max, d) => {
          const order = ['Low', 'Medium', 'High', 'Critical']
          const r = d.overallRisk || 'Low'
          return order.indexOf(r) > order.indexOf(max) ? r : max
        }, 'Low') as string,
      riskFlagCount: allDocFlags.length,
      documents: analyzedDocs.map((d) => ({
        fileName: d.fileName,
        documentType: d.documentType,
        overallRisk: d.overallRisk,
        analysis: parseDocumentAnalysis(d.aiAnalysis),
      })),
    }

    const prompt = `You are a senior TPRM analyst reviewing a vendor risk assessment.

Vendor: ${vendor.companyName}
Service Type: ${vendor.serviceType}
Risk Tier: ${vendor.tier}
Inherent Risk: ${vendor.inherentRiskRating} (${vendor.inherentRiskScore}/25)
${documentContext ? `\nCompliance documents reviewed:\n${documentContext}` : ''}

Questions and Responses:
${qaBlock}

Analyze each response for completeness, quality of controls, and risk gaps.

Return ONLY a valid JSON object, no markdown, no backticks, no explanation:
{
  "scores": { ${questions.map((q: { id: string }) => `"${q.id}": 70`).join(', ')} },
  "overallScore": 65,
  "riskLevel": "Medium",
  "aiNarrative": "Write 4-5 sentences summarizing this vendor risk posture with specific observations.",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Action 1", "Action 2", "Action 3"]
}

Rules:
- scores must include a number 0-100 for EVERY question id: ${questionIds}
- riskLevel must be exactly one of: Low, Medium, High, Critical
- overallScore must be a number 0-100
- return ONLY the JSON object, nothing else`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON', raw: cleaned },
        { status: 500 }
      )
    }

    const inherentLikelihood = vendor.inherentLikelihood ?? 2
    const inherentImpact = vendor.inherentImpact ?? 2

    const residual = calculateResidualRisk(
      inherentLikelihood,
      inherentImpact,
      result.scores as Record<string, number>
    )

    const assessment = await prisma.assessment.create({
      data: {
        vendorId,
        questions: JSON.stringify(questions),
        responses: JSON.stringify(responses),
        scores: JSON.stringify(result.scores),
        overallScore: Number(result.overallScore),
        riskLevel: result.riskLevel,
        aiNarrative: result.aiNarrative,
        keyFindings: JSON.stringify(result.keyFindings),
        recommendations: JSON.stringify(result.recommendations),
        documentAnalysis: JSON.stringify(documentAnalysisSnapshot),
        status: 'completed',
        approvalStatus: 'pending',
        controlEffectivenessScore: residual.controlEffectivenessScore,
        residualLikelihood: residual.residualLikelihood,
        residualImpact: residual.residualImpact,
        residualRiskScore: residual.residualRiskScore,
        residualRiskRating: residual.residualRiskRating,
        risksIdentified: residual.risksIdentified,
        criticalRisks: residual.criticalRisks,
        highRisks: residual.highRisks,
        mediumRisks: residual.mediumRisks,
        lowRisks: residual.lowRisks,
      },
    })

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'completed' },
    })

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('Score API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
