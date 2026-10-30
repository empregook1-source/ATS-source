/**
 * Resume Parser
 *
 * Extracts text content from uploaded documents (PDF, DOCX, DOC).
 * Returns structured parsed content for storage in document.parsedContent.
 *
 * Supports:
 *   - PDF — via pdf-parse (pdfjs-dist based)
 *   - DOCX — via mammoth (XML-based, reliable)
 *   - DOC — via word-extractor (OLE2 compound documents)
 */
import mammoth from 'mammoth'
// @ts-ignore — word-extractor has no bundled type declarations
import WordExtractor from 'word-extractor'
import { logError, logWarn } from './logger'

// pdfjs-dist uses browser APIs (DOMMatrix, Path2D, ImageData) at module scope.
// In Node.js these don't exist, so we install minimal stubs before importing.
// We only use pdfjs-dist for text extraction — no actual rendering is needed.
function ensurePdfjsPolyfills() {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // Lightweight stub for pdfjs-dist in non-browser runtimes.
    // We only need enough surface for text extraction paths.
    globalThis.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
      multiplySelf() { return this }
      preMultiplySelf() { return this }
      translateSelf() { return this }
      scaleSelf() { return this }
      rotateSelf() { return this }
      invertSelf() { return this }
      setMatrixValue() { return this }
      static fromMatrix() { return new DOMMatrix() }
    } as any
  }
  if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
      data: Uint8ClampedArray; width: number; height: number
      constructor(w: number, h: number) {
        this.width = w; this.height = h
        this.data = new Uint8ClampedArray(w * h * 4)
      }
    } as any
  }
  if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = class Path2D {} as any
  }
}

const PARSER_VERSION = '1.0'

export interface ParsedResume {
  /** Full extracted text content */
  text: string
  /** Detected sections (best-effort heuristic) */
  sections: ResumeSection[]
  /** Parsing metadata */
  metadata: {
    pageCount: number | null
    wordCount: number
    characterCount: number
    extractedAt: string
    parserVersion: string
    sourceFormat: 'pdf' | 'docx' | 'doc'
  }
}

export interface ResumeSection {
  heading: string
  content: string
}

/**
 * Parse a document buffer and extract text content.
 * Routes to the appropriate parser based on MIME type.
 *
 * @param buffer - Raw file bytes
 * @param mimeType - Validated MIME type of the document
 * @returns Structured parsed content, or null if extraction fails
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<ParsedResume | null> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await parsePdf(buffer)
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await parseDocx(buffer)
      case 'application/msword':
        return await parseDoc(buffer)
      default:
        logWarn('resume_parser.unsupported_mime_type', {
          mime_type: mimeType,
        })
        return null
    }
  }
  catch (error) {
    logError('resume_parser.parse_failed', {
      mime_type: mimeType,
      error_message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

// ─── PDF Parser ───────────────────────────────────────────────────

async function parsePdf(buffer: Buffer): Promise<ParsedResume | null> {
  // Polyfill browser globals before pdfjs-dist evaluates its module-level code
  ensurePdfjsPolyfills()
  const result = await extractPdfText(buffer)
  const text = normalizeText(result.text)
  if (!text) {
    return null
  }

  const parsed: ParsedResume = {
    text,
    sections: extractSections(text),
    metadata: {
      pageCount: result.pageCount,
      wordCount: countWords(text),
      characterCount: text.length,
      extractedAt: new Date().toISOString(),
      parserVersion: PARSER_VERSION,
      sourceFormat: 'pdf',
    },
  }
  return parsed
}

interface PdfTextResult {
  text: string
  pageCount: number | null
}

async function extractPdfText(buffer: Buffer): Promise<PdfTextResult> {
  // pdf-parse v2 recommends loading worker helpers before the main module.
  const pdfWorkerModule = await import('pdf-parse/worker').catch(() => null) as Record<string, unknown> | null
  const pdfModule = await import('pdf-parse') as Record<string, unknown>
  const defaultNamespace = typeof pdfModule.default === 'object' && pdfModule.default !== null
    ? pdfModule.default as Record<string, unknown>
    : null
  const workerNamespace = pdfWorkerModule && typeof pdfWorkerModule.default === 'object' && pdfWorkerModule.default !== null
    ? pdfWorkerModule.default as Record<string, unknown>
    : pdfWorkerModule

  // v2+ API: `new PDFParse({ data }).getText()`
  const PDFParseCtor = pdfModule.PDFParse ?? defaultNamespace?.PDFParse
  if (typeof PDFParseCtor === 'function') {
    const setWorker = (PDFParseCtor as { setWorker?: (worker: string) => void }).setWorker
    const workerGetData = workerNamespace?.getData
    const workerGetPath = workerNamespace?.getPath
    const CanvasFactory = workerNamespace?.CanvasFactory

    if (typeof setWorker === 'function') {
      try {
        if (typeof workerGetData === 'function') {
          const workerData = workerGetData()
          if (typeof workerData === 'string' && workerData.length > 0) {
            setWorker(workerData)
          }
        } else if (typeof workerGetPath === 'function') {
          const workerPath = workerGetPath()
          if (typeof workerPath === 'string' && workerPath.length > 0) {
            setWorker(workerPath)
          }
        }
      } catch {
        // Optional optimization for troublesome runtimes; text extraction can still work without this.
      }
    }

    const parserLoadParams: Record<string, unknown> = { data: buffer }
    if (typeof CanvasFactory === 'function') {
      parserLoadParams.CanvasFactory = CanvasFactory
    }

    const parser = new (PDFParseCtor as new (...args: any[]) => {
      getText: () => Promise<{ text?: string; total?: number }>
      destroy?: () => Promise<void>
    })(parserLoadParams)

    try {
      const result = await parser.getText()
      return {
        text: typeof result?.text === 'string' ? result.text : '',
        pageCount: typeof result?.total === 'number' ? result.total : null,
      }
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy()
      }
    }
  }

  // v1-compatible API: default export as function `pdf(buffer)`
  const defaultExport = pdfModule.default
  if (typeof defaultExport === 'function') {
    const result = await (defaultExport as (input: Buffer) => Promise<{ text?: string; numpages?: number }>)(buffer)
    return {
      text: typeof result?.text === 'string' ? result.text : '',
      pageCount: typeof result?.numpages === 'number' ? result.numpages : null,
    }
  }

  // Some CommonJS builds expose parser function as `default.default`.
  const nestedDefaultFn = defaultNamespace?.default
  if (typeof nestedDefaultFn === 'function') {
    const result = await (nestedDefaultFn as (input: Buffer) => Promise<{ text?: string; numpages?: number }>)(buffer)
    return {
      text: typeof result?.text === 'string' ? result.text : '',
      pageCount: typeof result?.numpages === 'number' ? result.numpages : null,
    }
  }

  throw new Error('Unsupported pdf-parse module export shape')
}

// ─── DOCX Parser ──────────────────────────────────────────────────

async function parseDocx(buffer: Buffer): Promise<ParsedResume | null> {
  const result = await mammoth.extractRawText({ buffer })

  const text = normalizeText(result.value)
  if (!text) return null

  return {
    text,
    sections: extractSections(text),
    metadata: {
      pageCount: null, // DOCX doesn't have pages
      wordCount: countWords(text),
      characterCount: text.length,
      extractedAt: new Date().toISOString(),
      parserVersion: PARSER_VERSION,
      sourceFormat: 'docx',
    },
  }
}

// ─── DOC Parser (Legacy) ──────────────────────────────────────────

async function parseDoc(buffer: Buffer): Promise<ParsedResume | null> {
  const extractor = new WordExtractor()
  const doc = await extractor.extract(buffer)

  // Combine main body, headers, and footers
  const parts = [
    doc.getBody(),
    doc.getHeaders({ includeFooters: false }),
    doc.getFooters(),
  ].filter(Boolean)

  const rawText = parts.join('\n')
  const text = normalizeText(rawText)
  if (!text) return null

  return {
    text,
    sections: extractSections(text),
    metadata: {
      pageCount: null,
      wordCount: countWords(text),
      characterCount: text.length,
      extractedAt: new Date().toISOString(),
      parserVersion: PARSER_VERSION,
      sourceFormat: 'doc',
    },
  }
}

// ─── Text Normalization ───────────────────────────────────────────

/**
 * Clean up extracted text: collapse whitespace, trim, remove control chars.
 * Returns empty string if no meaningful content was extracted.
 */
function normalizeText(raw: string): string {
  return raw
    // Remove null bytes and control characters (except newline/tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Windows line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces/tabs on same line into one
    .replace(/[^\S\n]+/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim()
}

// ─── Section Extraction ───────────────────────────────────────────

/**
 * Best-effort extraction of resume sections based on common heading patterns.
 * This is a heuristic approach — not all resumes follow standard formats.
 */
const SECTION_HEADINGS = [
  // Experience / Work
  /^(?:work\s*)?experience/i,
  /^employment\s*(?:history)?/i,
  /^professional\s*(?:experience|background|history)/i,
  /^career\s*(?:history|summary)/i,
  /^work\s*history/i,

  // Education
  /^education(?:al\s*background)?/i,
  /^academic\s*(?:background|qualifications)/i,
  /^qualifications/i,

  // Skills
  /^(?:technical\s*)?skills/i,
  /^core\s*competencies/i,
  /^technologies/i,
  /^tools?\s*(?:&|and)\s*technologies/i,
  /^expertise/i,

  // Summary / Profile / Objective
  /^(?:professional\s*)?summary/i,
  /^(?:career\s*)?objective/i,
  /^profile/i,
  /^about\s*(?:me)?/i,

  // Certifications / Awards
  /^certifications?/i,
  /^licenses?\s*(?:&|and)\s*certifications?/i,
  /^awards?\s*(?:&|and)\s*(?:honors?|achievements?)/i,
  /^achievements?/i,
  /^honors?/i,

  // Projects / Publications
  /^(?:key\s*)?projects?/i,
  /^publications?/i,
  /^research/i,
  /^portfolio/i,

  // Languages / Interests
  /^languages?/i,
  /^interests?\s*(?:&|and)\s*(?:hobbies|activities)/i,
  /^hobbies/i,
  /^volunteer(?:ing)?\s*(?:experience)?/i,

  // References
  /^references?/i,

  // Contact
  /^contact\s*(?:information|details)?/i,
  /^personal\s*(?:information|details)/i,
]

function extractSections(text: string): ResumeSection[] {
  const lines = text.split('\n')
  const sections: ResumeSection[] = []
  let currentHeading: string | null = null
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      currentContent.push('')
      continue
    }

    // Check if this line matches a known section heading pattern
    // Headings are typically short (< 60 chars) and on their own line
    const isHeading = trimmed.length < 60 && SECTION_HEADINGS.some(pattern => pattern.test(trimmed))

    if (isHeading) {
      // Save previous section
      if (currentHeading !== null) {
        const content = currentContent.join('\n').trim()
        if (content) {
          sections.push({ heading: currentHeading, content })
        }
      }
      currentHeading = trimmed
      currentContent = []
    }
    else {
      currentContent.push(trimmed)
    }
  }

  // Save last section
  if (currentHeading !== null) {
    const content = currentContent.join('\n').trim()
    if (content) {
      sections.push({ heading: currentHeading, content })
    }
  }

  return sections
}

// ─── Helpers ──────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

// ─── Resume Text Extraction ──────────────────────────────────────

/**
 * Extract plain text from a parsedContent JSONB value.
 * Handles both the structured ParsedResume format and legacy string values.
 * Used by the scoring/analysis endpoints.
 *
 * @param parsedContent - The raw JSONB value from document.parsedContent
 * @returns The extracted text, or null if no content is available
 */
export function extractResumeText(parsedContent: unknown): string | null {
  if (!parsedContent) return null

  // Structured ParsedResume format: { text: "...", sections: [...], metadata: {...} }
  if (typeof parsedContent === 'object' && parsedContent !== null && 'text' in parsedContent) {
    const text = (parsedContent as { text: unknown }).text
    if (typeof text === 'string' && text.trim()) return text
    // If it has a text property but it's empty, there's no useful content
    return null
  }

  // Legacy: plain string value
  if (typeof parsedContent === 'string' && parsedContent.trim()) {
    return parsedContent
  }

  // Fallback: stringify object (should rarely happen)
  if (typeof parsedContent === 'object') {
    const str = JSON.stringify(parsedContent)
    return str && str !== '{}' && str !== '[]' ? str : null
  }

  return null
}
