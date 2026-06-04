export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    void request
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: { vendor: true },
    })

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...assessment,
      questions: JSON.parse(assessment.questions),
      responses: JSON.parse(assessment.responses),
      scores: JSON.parse(assessment.scores),
      keyFindings: JSON.parse(assessment.keyFindings),
      recommendations: JSON.parse(assessment.recommendations),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
