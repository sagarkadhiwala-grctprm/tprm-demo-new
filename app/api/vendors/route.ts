export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { TierClassification, VendorFormData } from '@/lib/types'

export async function GET(request: Request) {
  try {
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
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        latestAssessment: latest
          ? {
              id: latest.id,
              overallScore: latest.overallScore,
              riskLevel: latest.riskLevel,
              completedAt: latest.completedAt,
            }
          : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VendorFormData & {
      serviceDescription: string
    }

    const dataTypesStr = Array.isArray(body.dataTypes)
      ? body.dataTypes.join(', ')
      : String(body.dataTypes)

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

Return ONLY valid JSON, no other text:
{
  "tier": 1,
  "rationale": "2-sentence explanation of why this tier was assigned",
  "keyRiskFactors": ["factor1", "factor2", "factor3"]
}`

    const classification = await callClaude<TierClassification>(prompt)

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
      },
    })

    return NextResponse.json({
      ...vendor,
      keyRiskFactors: classification.keyRiskFactors,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
