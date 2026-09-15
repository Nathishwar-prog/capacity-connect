import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';
import logger from '../logger/winston.logger';
import {
  NormalizedBlock,
  NormalizedDocument,
  NormalizedDocumentMetadata,
} from '../types/normalized-document';

export interface ExtractorOptions {
  ocrEngine?: 'rapidocr' | 'easyocr' | 'tesseract' | 'auto';
  forceOcr?: boolean;
  minCharsForNativePdf?: number;
}

export class DocumentExtractorService {
  private defaultOptions: ExtractorOptions = {
    ocrEngine: 'rapidocr',
    forceOcr: false,
    minCharsForNativePdf: 40,
  };

  /**
   * Extract document content into NormalizedDocument intermediate representation
   */
  public async extract(
    filePathOrBuffer: string | Buffer,
    fileType: 'DOCX' | 'PDF' | 'IMAGE',
    documentId: string,
    originalFileName?: string,
    options?: ExtractorOptions
  ): Promise<NormalizedDocument> {
    const opts = { ...this.defaultOptions, ...options };
    const tempDir = path.join(process.cwd(), 'uploads', 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let filePath: string;
    let buffer: Buffer;

    if (typeof filePathOrBuffer === 'string') {
      filePath = filePathOrBuffer;
      buffer = fs.readFileSync(filePath);
      if (!originalFileName) {
        originalFileName = path.basename(filePath);
      }
    } else {
      buffer = filePathOrBuffer;
      const ext = fileType === 'DOCX' ? '.docx' : fileType === 'PDF' ? '.pdf' : '.png';
      filePath = path.join(tempDir, `extract_${documentId}_${Date.now()}${ext}`);
      fs.writeFileSync(filePath, buffer);
      if (!originalFileName) {
        originalFileName = path.basename(filePath);
      }
    }

    logger.info(`Extracting document ${documentId}: type=${fileType}, size=${buffer.length} bytes`);

    // 1. Check if native extraction is viable
    if (fileType === 'DOCX') {
      return this.extractFromDocx(buffer, documentId, originalFileName);
    } else if (fileType === 'PDF') {
      return this.extractFromPdf(buffer, filePath, documentId, originalFileName, opts);
    } else {
      return this.extractViaDoclingWorker(filePath, documentId, originalFileName, opts, true);
    }
  }

  /**
   * Native DOCX extraction using Mammoth AST + block normalization
   */
  private async extractFromDocx(
    buffer: Buffer,
    documentId: string,
    originalFileName?: string
  ): Promise<NormalizedDocument> {
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const html = htmlResult.value;

    const rawTextResult = await mammoth.extractRawText({ buffer });
    const rawText = rawTextResult.value;

    const blocks: NormalizedBlock[] = [];
    let order = 1;

    // Parse HTML elements sequentially
    // Regex matches <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <table>
    const elementRegex = /<(h[1-6]|p|ul|ol|table)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    let estimatedPage = 1;
    let accumulatedChars = 0;
    const charsPerPage = 1800; // Standard estimate for printed docx pages

    while ((match = elementRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const innerHtml = match[2];
      const text = this.stripHtml(innerHtml).trim();

      if (!text && tag !== 'table') {
        continue;
      }

      accumulatedChars += text.length;
      estimatedPage = Math.max(1, Math.ceil(accumulatedChars / charsPerPage));

      let blockType: NormalizedBlock['type'] = 'paragraph';
      let level: number | undefined;

      if (tag.startsWith('h')) {
        blockType = 'heading';
        level = parseInt(tag[1], 10);
      } else if (tag === 'ul') {
        blockType = 'list';
      } else if (tag === 'ol') {
        blockType = 'numbered_list';
      } else if (tag === 'table') {
        blockType = 'table';
      } else if (tag === 'p') {
        // Detect bold title/heading paragraph
        if (/^<strong>.*?<\/strong>$/i.test(innerHtml.trim()) && text.length < 120) {
          blockType = 'heading';
          level = 2;
        } else if (/^<em>.*?<\/em>$/i.test(innerHtml.trim()) && text.length < 150) {
          blockType = 'caption';
        }
      }

      // Check for bullet list items inside lists
      let bulletItems: string[] | undefined;
      if (tag === 'ul' || tag === 'ol') {
        const liMatches = innerHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (liMatches) {
          bulletItems = liMatches
            .map((li) => this.stripHtml(li).trim())
            .filter((item) => item.length > 0);
        }
      }

      // Detect table rows
      let tableRows: string[][] | undefined;
      if (tag === 'table') {
        const trMatches = innerHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        if (trMatches) {
          tableRows = trMatches.map((tr) => {
            const tdMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
            return tdMatches.map((td) => this.stripHtml(td).trim());
          });
        }
      }

      blocks.push({
        id: `blk_${order}`,
        type: blockType,
        level,
        text,
        html: match[0],
        page: estimatedPage,
        order,
        confidence: 0.99,
        metadata: {
          tag,
          isBold: innerHtml.includes('<strong>') || innerHtml.includes('<b>'),
          isItalic: innerHtml.includes('<em>') || innerHtml.includes('<i>'),
          isAllCaps: text.length > 3 && text === text.toUpperCase(),
          bulletItems,
          tableRows,
        },
        provenance: {
          sourceDocumentId: documentId,
          sourcePage: estimatedPage,
          pageStart: estimatedPage,
          pageEnd: estimatedPage,
          blockIds: [`blk_${order}`],
          extractionMethod: 'native',
          confidence: 0.99,
        },
      });

      order++;
    }

    // Filter repeated headers/footers
    const cleanedBlocks = this.filterHeadersAndFooters(blocks);

    const docMeta: NormalizedDocumentMetadata = {
      id: documentId,
      title: this.inferDocumentTitle(cleanedBlocks, originalFileName),
      language: 'en',
      sourceType: 'docx',
      pageCount: estimatedPage,
      charCount: rawText.length,
      hasNativeText: true,
      needsOcr: false,
      ocrEngineUsed: null,
      parserVersion: 'mammoth-ast-1.0',
      extractionMethod: 'native',
      createdAt: new Date().toISOString(),
    };

    return {
      document: docMeta,
      blocks: cleanedBlocks,
    };
  }

  /**
   * PDF extraction with native check & OCR fallback
   */
  private async extractFromPdf(
    buffer: Buffer,
    filePath: string,
    documentId: string,
    originalFileName?: string,
    options?: ExtractorOptions
  ): Promise<NormalizedDocument> {
    const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;

    let pageList: Array<{ text: string; num: number }> = [];
    let fullText = '';

    if (PDFParseClass) {
      try {
        const parser = new PDFParseClass({ data: buffer });
        const result = await parser.getText();
        pageList = result.pages || [];
        fullText = pageList.map((p) => p.text).join('\n');
      } catch (err: any) {
        logger.warn(`PDFParse class extraction failed: ${err.message}`);
      }
    }

    // Check if native text is sufficient
    const totalChars = fullText.trim().length;
    const pageCount = Math.max(1, pageList.length);
    const avgCharsPerPage = totalChars / pageCount;

    const minChars = options?.minCharsForNativePdf || 40;
    const needsOcr = options?.forceOcr || avgCharsPerPage < minChars;

    if (needsOcr) {
      logger.info(`PDF has sparse/scanned text (${avgCharsPerPage.toFixed(1)} chars/page). Routing to OCR pipeline.`);
      try {
        const ocrResult = await this.extractViaDoclingWorker(filePath, documentId, originalFileName, options, true);
        if (ocrResult.blocks.length > 0) {
          return ocrResult;
        }
      } catch (ocrErr: any) {
        logger.warn(`OCR worker failed: ${ocrErr.message}. Falling back to best native text.`);
      }
    }

    // Process native PDF pages into NormalizedBlocks
    const blocks: NormalizedBlock[] = [];
    let order = 1;

    for (const page of pageList) {
      const lines = page.text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (const line of lines) {
        const isHeading = this.isLineLikelyHeading(line);

        blocks.push({
          id: `blk_${order}`,
          type: isHeading ? 'heading' : 'paragraph',
          level: isHeading ? (line.toLowerCase().startsWith('module') ? 1 : 2) : undefined,
          text: line,
          page: page.num,
          order,
          confidence: 0.95,
          metadata: {
            isAllCaps: line.length > 3 && line === line.toUpperCase(),
          },
          provenance: {
            sourceDocumentId: documentId,
            sourcePage: page.num,
            pageStart: page.num,
            pageEnd: page.num,
            blockIds: [`blk_${order}`],
            extractionMethod: 'native',
            confidence: 0.95,
          },
        });
        order++;
      }
    }

    const cleanedBlocks = this.filterHeadersAndFooters(blocks);

    return {
      document: {
        id: documentId,
        title: this.inferDocumentTitle(cleanedBlocks, originalFileName),
        language: 'en',
        sourceType: needsOcr ? 'scanned_pdf' : 'pdf',
        pageCount,
        charCount: totalChars,
        hasNativeText: !needsOcr,
        needsOcr,
        ocrEngineUsed: null,
        parserVersion: 'pdf-parse-native-1.0',
        extractionMethod: 'native',
        createdAt: new Date().toISOString(),
      },
      blocks: cleanedBlocks,
    };
  }

  /**
   * Run Docling / Python OCR worker asynchronously
   */
  private async extractViaDoclingWorker(
    filePath: string,
    documentId: string,
    originalFileName?: string,
    options?: ExtractorOptions,
    forceOcr = false
  ): Promise<NormalizedDocument> {
    const workerScript = path.join(process.cwd(), 'workers', 'docling_worker.py');
    const outputPath = path.join(process.cwd(), 'uploads', 'tmp', `docling_${documentId}_${Date.now()}.json`);

    const engine = options?.ocrEngine || 'rapidocr';
    const args = [workerScript, filePath, outputPath, '--ocr-engine', engine];
    if (forceOcr) {
      args.push('--force-ocr');
    }

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', args, {
        cwd: process.cwd(),
        timeout: 45000,
      });

      let stderr = '';
      pythonProcess.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          try {
            const rawJson = fs.readFileSync(outputPath, 'utf-8');
            const data = JSON.parse(rawJson) as NormalizedDocument;
            data.document.id = documentId;
            data.document.title = originalFileName || data.document.title;
            // Clean up temp json
            try {
              fs.unlinkSync(outputPath);
            } catch {}
            return resolve(data);
          } catch (e: any) {
            return reject(new Error(`Failed to read docling worker JSON: ${e.message}`));
          }
        }

        // If Python script exited with non-zero or file missing
        reject(new Error(`Docling worker exited with code ${code}: ${stderr}`));
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to spawn Python docling worker: ${err.message}`));
      });
    });
  }

  /**
   * Filter recurring headers, footers, and page numbers across pages
   */
  public filterHeadersAndFooters(blocks: NormalizedBlock[]): NormalizedBlock[] {
    const textFrequency = new Map<string, number>();

    // Count identical short lines appearing across multiple pages
    for (const b of blocks) {
      const trimmed = b.text.trim();
      if (trimmed.length > 2 && trimmed.length < 80) {
        textFrequency.set(trimmed, (textFrequency.get(trimmed) || 0) + 1);
      }
    }

    // Lines that appear 2 or more times and look like headers/footers
    const headerFooterTexts = new Set<string>();
    for (const [txt, count] of textFrequency.entries()) {
      if (
        count >= 2 &&
        (/^(page\s+\d+|\d+\s+of\s+\d+|confidential|internal\s+training|imd|moes|ministry of earth sciences)$/i.test(txt) ||
          /^\d+$/.test(txt))
      ) {
        headerFooterTexts.add(txt);
      }
    }

    return blocks.filter((b) => {
      if (b.type === 'page_header' || b.type === 'page_footer' || b.type === 'page_number') {
        return false;
      }
      const trimmed = b.text.trim();
      // Filter out pure page numbers (e.g. "1", "2")
      if (/^\d{1,3}$/.test(trimmed)) {
        return false;
      }
      if (headerFooterTexts.has(trimmed)) {
        return false;
      }
      return true;
    });
  }

  private isLineLikelyHeading(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 120) return false;
    if (/^(?:module|chapter|unit|part)\s+[0-9ivx]+/i.test(trimmed)) return true;
    if (/^(?:lesson\s+[0-9]+|\d+\.\d+|\d+\.)/i.test(trimmed)) return true;
    if (/^(?:course overview|learning outcomes|target audience|prerequisites|table of contents|glossary|references)/i.test(trimmed)) {
      return true;
    }
    return false;
  }

  private inferDocumentTitle(blocks: NormalizedBlock[], originalFileName?: string): string {
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      if (firstBlock.text && firstBlock.text.length < 100 && !/^(course overview|table of contents|module)/i.test(firstBlock.text)) {
        return firstBlock.text;
      }
    }
    if (originalFileName) {
      return originalFileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }
    return 'Imported Course';
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }
}

export const documentExtractorService = new DocumentExtractorService();
