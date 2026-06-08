import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { hasDatabaseConfig } from '@/lib/db-env'
import { calculateInherentRisk } from '@/lib/inherent-risk'
import { formatDataAccessSummary } from '@/lib/vendor-form-constants'
import { checkRateLimit } from '@/lib/ratelimit'
import { getClientIp, sanitize, sanitizeStringArray } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

export async function GET(request: Request) {
  try {
    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: 'Database not configured' },
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { success } = checkRateLimit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      )
    }

    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    const sanitizedBody = {
      companyName: sanitize(body.companyName, 200),
      serviceType: sanitize(body.serviceType, 100),
      serviceDescription: sanitize(body.serviceDescription, 1000),
      contactEmail: sanitize(body.contactEmail, 200),
      contactName: sanitize(body.contactName, 200),
      country: sanitize(body.country, 100),
      employeeCount: sanitize(body.employeeCount, 50),
      dataVolume: sanitize(body.dataVolume, 50),
      dataRetentionPeriod: sanitize(body.dataRetentionPeriod, 50),
      criticality: sanitize(body.criticality, 100),
      substitutability: sanitize(body.substitutability, 100),
      natureOfBusiness: sanitize(body.natureOfBusiness, 500),
      productsServices: sanitize(body.productsServices, 1000),
      subcontractors: sanitize(body.subcontractors, 10),
      dataTypes: sanitizeStringArray(body.dataTypes, 20),
      dataCategories: sanitizeStringArray(body.dataCategories, 20),
      geographicPresence: sanitizeStringArray(body.geographicPresence, 20),
      certifications: sanitizeStringArray(body.certifications, 20),
      regulatoryBodies: sanitizeStringArray(body.regulatoryBodies, 20),
    }

    if (!sanitizedBody.companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    const dataTypesStr = formatDataAccessSummary(
      sanitizedBody.dataCategories,
      sanitizedBody.dataTypes
    )

    const inherentRisk = calculateInherentRisk({
      dataCategories: sanitizedBody.dataCategories,
      geographicPresence: sanitizedBody.geographicPresence,
      certifications: sanitizedBody.certifications,
      substitutability: sanitizedBody.substitutability,
      criticality: sanitizedBody.criticality,
      dataVolume: sanitizedBody.dataVolume,
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
- Company: ${sanitizedBody.companyName}
- Service Type: ${sanitizedBody.serviceType}
- Nature of Business: ${sanitizedBody.natureOfBusiness || 'Not specified'}
- Products/Services: ${sanitizedBody.productsServices || sanitizedBody.serviceDescription || 'Not specified'}
- Data Categories: ${dataTypesStr}
- Business Criticality: ${sanitizedBody.criticality}
- Substitutability: ${sanitizedBody.substitutability}
- Uses Sub-contractors: ${sanitizedBody.subcontractors}

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
        { error: 'AI returned invalid JSON' },
        { status: 500 }
      )
    }

    const vendor = await prisma.vendor.create({
      data: {
        companyName: sanitizedBody.companyName,
        serviceType: sanitizedBody.serviceType,
        dataTypes: dataTypesStr,
        contactEmail: sanitizedBody.contactEmail,
        contactName: sanitizedBody.contactName,
        country: sanitizedBody.country,
        employeeCount: sanitizedBody.employeeCount,
        tier: classification.tier,
        tierRationale: classification.rationale,
        status: 'pending_assessment',
        natureOfBusiness: sanitizedBody.natureOfBusiness || null,
        productsServices: sanitizedBody.productsServices || null,
        dataCategories:
          sanitizedBody.dataCategories.length > 0
            ? JSON.stringify(sanitizedBody.dataCategories)
            : null,
        dataVolume: sanitizedBody.dataVolume || null,
        dataRetentionPeriod: sanitizedBody.dataRetentionPeriod || null,
        geographicPresence:
          sanitizedBody.geographicPresence.length > 0
            ? JSON.stringify(sanitizedBody.geographicPresence)
            : null,
        certifications:
          sanitizedBody.certifications.length > 0
            ? JSON.stringify(sanitizedBody.certifications)
            : null,
        regulatoryBodies:
          sanitizedBody.regulatoryBodies.length > 0
            ? JSON.stringify(sanitizedBody.regulatoryBodies)
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
