export interface BlockProvenance {
  sourceDocumentId?: string;
  sourceSection?: string;
  sourceParagraph?: number;
  sourcePage?: number;
  pageStart?: number;
  pageEnd?: number;
  blockIds?: string[];
  extractionMethod?: 'native' | 'docling' | 'ocr' | 'hybrid';
  characterOffset?: number;
  confidence: number;
}

export type NormalizedBlockType =
  | 'title'
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'numbered_list'
  | 'table'
  | 'image'
  | 'caption'
  | 'page_header'
  | 'page_footer'
  | 'page_number'
  | 'formula'
  | 'quote'
  | 'unknown';

export interface NormalizedBlock {
  id: string;
  type: NormalizedBlockType;
  level?: number;
  text: string;
  html?: string;
  page: number;
  order: number;
  confidence: number;
  metadata?: {
    tag?: string;
    isBold?: boolean;
    isItalic?: boolean;
    isAllCaps?: boolean;
    bulletItems?: string[];
    tableHeaders?: string[];
    tableRows?: string[][];
    imageUrl?: string;
    numberingPrefix?: string;
    boundingBox?: { x0: number; y0: number; x1: number; y1: number };
  };
  provenance?: BlockProvenance;
}

export interface NormalizedDocumentMetadata {
  id: string;
  title: string;
  language: string;
  sourceType: 'docx' | 'pdf' | 'scanned_pdf' | 'image' | 'unknown';
  pageCount: number;
  charCount: number;
  hasNativeText: boolean;
  needsOcr: boolean;
  ocrEngineUsed?: 'rapidocr' | 'easyocr' | 'tesseract' | null;
  parserVersion: string;
  extractionMethod: 'native' | 'docling' | 'ocr' | 'hybrid';
  createdAt: string;
}

export interface NormalizedDocument {
  document: NormalizedDocumentMetadata;
  blocks: NormalizedBlock[];
}
