declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string
    IsAcroFormPresent?: boolean
    IsXFAPresent?: boolean
    Title?: string
    Author?: string
    Subject?: string
    Creator?: string
    Producer?: string
    CreationDate?: string
    ModDate?: string
    [key: string]: unknown
  }

  interface PDFMetadata {
    info: PDFInfo
    metadata: Record<string, unknown>
  }

  interface PDFParseOptions {
    max?: number
    version?: string
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata: PDFMetadata | null
    text: string
    version: string
  }

  function pdfParse(data: Buffer, options?: PDFParseOptions): Promise<PDFData>
  export = pdfParse
}

declare module 'pdf-parse-debugging-disabled' {
  interface PDFInfo {
    PDFFormatVersion?: string
    IsAcroFormPresent?: boolean
    IsXFAPresent?: boolean
    Title?: string
    Author?: string
    Subject?: string
    Creator?: string
    Producer?: string
    CreationDate?: string
    ModDate?: string
    [key: string]: unknown
  }

  interface PDFMetadata {
    info: PDFInfo
    metadata: Record<string, unknown>
  }

  interface PDFParseOptions {
    max?: number
    version?: string
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata: PDFMetadata | null
    text: string
    version: string
  }

  function pdfParse(data: Buffer, options?: PDFParseOptions): Promise<PDFData>
  export = pdfParse
}

