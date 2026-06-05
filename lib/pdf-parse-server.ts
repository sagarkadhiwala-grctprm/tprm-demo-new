/**
 * Load pdf-parse without the package index.js debug harness (breaks on Vercel/Next bundles).
 */
export async function parsePdfBuffer(
  buffer: Buffer
): Promise<{ text?: string }> {
  // Direct lib path avoids index.js `!module.parent` test-file reads
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
    buf: Buffer
  ) => Promise<{ text?: string }>
  return pdfParse(buffer)
}
