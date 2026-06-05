import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeDocumentWithAi } from '@/lib/analyze-document-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, documentId } = body as {
      vendorId?: string
      documentId?: string
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
    }

    const where = documentId
      ? { id: documentId, vendorId }
      : { vendorId, status: { in: ['uploaded', 'failed', 'analyzing'] } }

    const documents = await prisma.vendorDocument.findMany({ where })

    if (!documents.length) {
      return NextResponse.json(
        { error: 'No documents to analyze. Upload a document first.' },
        { status: 404 }
      )
    }

    const results: Array<Record<string, unknown>> = []
    const errors: string[] = []

    for (const doc of documents) {
      await prisma.vendorDocument.update({
        where: { id: doc.id },
        data: { status: 'analyzing' },
      })

      try {
        const analysis = await analyzeDocumentWithAi(
          doc.fileName,
          doc.documentType,
          doc.extractedText
        )

        const updated = await prisma.vendorDocument.update({
          where: { id: doc.id },
          data: {
            status: 'analyzed',
            aiAnalysis: JSON.stringify(analysis),
            overallRisk: analysis.overallDocumentRisk,
          },
        })

        results.push({
          ...updated,
          aiAnalysis: analysis,
        })
      } catch (docError) {
        const message =
          docError instanceof Error ? docError.message : String(docError)
        console.error(`Document analyze failed [${doc.fileName}]:`, docError)

        await prisma.vendorDocument.update({
          where: { id: doc.id },
          data: { status: 'failed' },
        })

        errors.push(`${doc.fileName}: ${message}`)
        results.push({
          id: doc.id,
          fileName: doc.fileName,
          status: 'failed',
          error: message,
        })
      }
    }

    const successCount = results.filter((r) => !r.error).length

    if (successCount === 0) {
      return NextResponse.json(
        {
          error: 'All document analyses failed',
          details: errors,
          analyzed: results,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      analyzed: results,
      successCount,
      failureCount: errors.length,
      errors: errors.length ? errors : undefined,
    })
  } catch (error) {
    console.error('Document analyze error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
