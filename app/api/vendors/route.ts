import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { hasDatabaseConfig } from '@/lib/db-env'
import { calculateInherentRisk } from '@/lib/inherent-risk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function GET(request: Request) {
  try {
    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: 'Database not configured', details: 'DATABASE_URL is missing' },
        { status: 500 }
      )
    }

    void request
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assessments: {
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    })

    const result = vendors.map((vendor) => {
      const latest = vendor.assessments[0]
      return {
        id: vendor.id,
        companyName: vendor.companyName,
        serviceType: vendor.serviceType,
        dataTypes: vendor.dataTypes,
        contactEmail: vendor.contactEmail,
        contactName: vendor.contactName,
        country: vendor.country,
        employeeCount: vendor.employeeCount,
        tier: vendor.tier,
        tierRationale: vendor.tierRationale,
        status: vendor.status,
        inherentLikelihood: vendor.inherentLikelihood,
        inherentImpact: vendor.inherentImpact,
        inherentRiskScore: vendor.inherentRiskScore,
        inherentRiskRating: vendor.inherentRiskRating,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        latestAssessment: latest
          ? {
              id: latest.id,
              overallScore: latest.overallScore,
              riskLevel: latest.riskLevel,
              residualRiskRating: latest.residualRiskRating,
              approvalStatus: latest.approvalStatus,
              completedAt: latest.completedAt,
            }
          : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vendors GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: 'Database not configured', details: 'DATABASE_URL is missing' },
        { status: 500 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured', details: 'ANTHROPIC_API_KEY is missing' },
        { status: 500 }
      )
    }

    const body = await request.json()

    const dataTypesStr = Array.isArray(body.dataTypes)
      ? body.dataTypes.join(', ')
      : String(body.dataTypes ?? '')

    const inherentRisk = calculateInherentRisk({
      dataCategories: body.dataCategories,
      geographicPresence: body.geographicPresence,
      certifications: body.certifications,
      substitutability: body.substitutability,
      criticality: body.criticality,
      dataVolume: body.dataVolume,
    })

    const prompt = `You are a senior TPRM (Third Party Risk Management) analyst at a global bank.

Classify this vendor into a risk tier based on their profile:

TIER 1 — CRITICAL: Vendor accesses Customer PII, Financial Records, or Trading Data. 
OR vendor is sole-source with critical business impact. Requires full due diligence.

TIER 2 — MODERATE: Vendor accesses some sensitive data (employee data, internal systems) 
OR has high business criticality. Requires standard assessment.

TIER 3 — LOW RISK: Vendor accesses no sensitive data AND has medium or low business 
impact. Requires lightweight review.

Vendor Profile:
- Company: ${body.companyName}
- Service Type: ${body.serviceType}  
- Service Description: ${body.serviceDescription}
- Data Access: ${dataTypesStr}
- Business Criticality: ${body.criticality}
- Substitutability: ${body.substitutability}
- Uses Sub-contractors: ${body.subcontractors}

Return ONLY a valid JSON object, no markdown, no backticks, no explanation:
{
  "tier": 1,
  "rationale": "2-sentence explanation of why this tier was assigned",
  "keyRiskFactors": ["factor1", "factor2", "factor3"]
}`

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

    let classification
    try {
      classification = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON', raw: cleaned },
        { status: 500 }
      )
    }

    const vendor = await prisma.vendor.create({
      data: {
        companyName: body.companyName,
        serviceType: body.serviceType,
        dataTypes: dataTypesStr,
        contactEmail: body.contactEmail,
        contactName: body.contactName,
        country: body.country,
        employeeCount: body.employeeCount,
        tier: classification.tier,
        tierRationale: classification.rationale,
        status: 'pending_assessment',
        natureOfBusiness: body.natureOfBusiness ?? null,
        productsServices: body.productsServices ?? body.serviceDescription ?? null,
        dataCategories: Array.isArray(body.dataCategories)
          ? JSON.stringify(body.dataCategories)
          : null,
        dataVolume: body.dataVolume ?? null,
        dataRetentionPeriod: body.dataRetentionPeriod ?? null,
        geographicPresence: Array.isArray(body.geographicPresence)
          ? JSON.stringify(body.geographicPresence)
          : null,
        certifications: Array.isArray(body.certifications)
          ? JSON.stringify(body.certifications)
          : null,
        regulatoryBodies: Array.isArray(body.regulatoryBodies)
          ? JSON.stringify(body.regulatoryBodies)
          : null,
        inherentLikelihood: inherentRisk.likelihood,
        inherentImpact: inherentRisk.impact,
        inherentRiskScore: inherentRisk.score,
        inherentRiskRating: inherentRisk.rating,
      },
    })

    return NextResponse.json({
      ...vendor,
      keyRiskFactors: classification.keyRiskFactors,
    })
  } catch (error) {
    console.error('Vendors POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
