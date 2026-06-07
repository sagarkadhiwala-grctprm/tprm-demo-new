import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateInherentRisk } from '@/lib/inherent-risk'
import { formatDataAccessSummary } from '@/lib/vendor-form-constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    void request
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        assessments: {
          orderBy: { completedAt: 'desc' },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Vendor GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const dataTypesStr = formatDataAccessSummary(body.dataCategories, body.dataTypes)

    const inherentRisk = calculateInherentRisk({
      dataCategories: body.dataCategories,
      geographicPresence: body.geographicPresence,
      certifications: body.certifications,
      substitutability: body.substitutability,
      criticality: body.criticality,
      dataVolume: body.dataVolume,
    })

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        companyName: body.companyName,
        serviceType: body.serviceType,
        dataTypes: dataTypesStr,
        contactEmail: body.contactEmail,
        contactName: body.contactName,
        country: body.country,
        employeeCount: body.employeeCount,
        natureOfBusiness: body.natureOfBusiness ?? null,
        productsServices: body.productsServices ?? null,
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

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Vendor PATCH API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    void request

    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.assessment.deleteMany({ where: { vendorId: params.id } }),
      prisma.vendor.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vendor DELETE API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
