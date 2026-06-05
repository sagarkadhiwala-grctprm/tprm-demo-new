import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MAX_DOCUMENT_BYTES } from '@/lib/documents'
import { extractTextFromBuffer, isSupportedDocument } from '@/lib/extract-text'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const vendorId = formData.get('vendorId') as string | null
    const documentType = formData.get('documentType') as string | null
    const file = formData.get('file') as File | null

    if (!vendorId || !documentType || !file) {
      return NextResponse.json(
        { error: 'vendorId, documentType, and file are required' },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds 4MB limit' },
        { status: 400 }
      )
    }

    if (!isSupportedDocument(file.type, file.name)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PDF, TXT, or MD.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const extractedText = await extractTextFromBuffer(
      buffer,
      file.type,
      file.name
    )

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No readable text found in document' },
        { status: 400 }
      )
    }

    const document = await prisma.vendorDocument.create({
      data: {
        vendorId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        documentType,
        extractedText,
        fileSize: file.size,
        status: 'uploaded',
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
