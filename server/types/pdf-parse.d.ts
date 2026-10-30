declare module 'pdf-parse' {
  export interface PDFTextResult {
    text?: string
    total?: number
    numpages?: number
  }

  export class PDFParse {
    constructor(params: Record<string, unknown>)
    static setWorker?(worker: string): void
    getText(params?: Record<string, unknown>): Promise<PDFTextResult>
    destroy?(): Promise<void>
  }

  const defaultExport: ((input: Uint8Array) => Promise<PDFTextResult>) | Record<string, unknown>
  export default defaultExport
}

declare module 'pdf-parse/worker' {
  export function getData(): string
  export function getPath(): string
  export const CanvasFactory: unknown
}

declare module '@react-pdf/renderer' {
  export const Document: any
  export const Page: any
  export const Text: any
  export const View: any
  export const StyleSheet: any
  export const pdf: any
}

declare module 'react' {
  const React: any
  export default React
  export function createElement(...args: any[]): any
}

declare module 'react-dom' {
  const ReactDOM: any
  export default ReactDOM
}
