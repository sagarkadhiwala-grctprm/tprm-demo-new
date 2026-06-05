import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDocumentAnalysis } from '@/lib/documents'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    void request
    const documents = await prisma.vendorDocument.findMany({
      where: { vendorId: params.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        vendorId: true,
        fileName: true,
        mimeType: true,
        documentType: true,
        fileSize: true,
        status: true,
        overallRisk: true,
        aiAnalysis: true,
        createdAt: true,
      },
    })

    const result = documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      aiAnalysis: parseDocumentAnalysis(doc.aiAnalysis),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
