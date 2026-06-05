/**
 * Extract and parse JSON from Claude responses (handles fences, preamble text).
 */
export function parseAiJson<T>(text: string): T {
  const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(clean) as T
  } catch {
    // Try object
    const objStart = clean.indexOf('{')
    const objEnd = clean.lastIndexOf('}')
    if (objStart >= 0 && objEnd > objStart) {
      try {
        return JSON.parse(clean.slice(objStart, objEnd + 1)) as T
      } catch {
        /* try array below */
      }
    }

    // Try array
    const arrStart = clean.indexOf('[')
    const arrEnd = clean.lastIndexOf(']')
    if (arrStart >= 0 && arrEnd > arrStart) {
      return JSON.parse(clean.slice(arrStart, arrEnd + 1)) as T
    }

    throw new Error('AI response was not valid JSON')
  }
}
