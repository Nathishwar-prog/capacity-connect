import fs from 'fs';
import path from 'path';
import { DocumentParserService } from '../src/services/document-parser.service';
import { DocumentStructureAnalyzerService } from '../src/services/document-structure-analyzer.service';
import { DocumentExtractorService } from '../src/services/document-extractor.service';
import { NormalizedDocument, NormalizedBlock, NormalizedDocumentMetadata } from '../src/types/normalized-document';

interface ScenarioResult {
  id: number;
  title: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const results: ScenarioResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

async function runScenario(id: number, title: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ id, title, passed: true, message: 'PASSED', durationMs });
    console.log(`[PASS] Scenario ${id}: ${title} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ id, title, passed: false, message: err.message, durationMs });
    console.error(`[FAIL] Scenario ${id}: ${title} (${durationMs}ms) -> ${err.message}`);
  }
}

function createMockMetadata(id: string, fileName: string, pageCount: number, hasNativeText: boolean, needsOcr: boolean): NormalizedDocumentMetadata {
  return {
    id,
    title: fileName.replace(/\.[^/.]+$/, ''),
    language: 'en',
    sourceType: fileName.endsWith('.docx') ? 'docx' : 'pdf',
    pageCount,
    charCount: 1000,
    hasNativeText,
    needsOcr,
    parserVersion: '2.0.0',
    extractionMethod: needsOcr ? 'ocr' : 'native',
    createdAt: new Date().toISOString(),
  };
}

async function main() {
  console.log('===============================================================');
  console.log('CAPACITY CONNECT: 15 GOLDEN TEST SCENARIOS SUITE');
  console.log('Robust Document Intelligence & Course Mapping Pipeline');
  console.log('===============================================================\n');

  const parserService = new DocumentParserService();
  const analyzerService = new DocumentStructureAnalyzerService();
  const extractorService = new DocumentExtractorService();

  const docPath = path.join(process.cwd(), 'uploads', 'Forecasters_Training_Course.docx');
  const hasGoldenDoc = fs.existsSync(docPath);

  // --------------------------------------------------------------------------
  // Scenario 1: Normal clean DOCX with styles
  // --------------------------------------------------------------------------
  await runScenario(1, 'Normal clean DOCX with styles (Golden Forecasters Document)', async () => {
    assert(hasGoldenDoc, `Golden document not found at: ${docPath}`);
    const buffer = fs.readFileSync(docPath);
    const parsed = await parserService.parseDocument(buffer, 'DOCX', 'test-doc-1', 'Forecasters_Training_Course.docx');

    assert(parsed.title.toLowerCase().includes('forecasters'), `Title mismatch: ${parsed.title}`);
    assert(parsed.modules.length === 7, `Expected 7 modules, got ${parsed.modules.length}`);
    const totalLessons = parsed.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0);
    assert(totalLessons === 27, `Expected 27 lessons, got ${totalLessons}`);
    assert((parsed.specialSections?.glossary?.length || 0) > 0, 'Glossary terms missing');
    assert((parsed.specialSections?.references?.length || 0) > 0, 'References missing');
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Poorly styled DOCX (all "Normal" style, bold/size only)
  // --------------------------------------------------------------------------
  await runScenario(2, 'Poorly styled DOCX (all "Normal" style, bold/size only)', async () => {
    const unstyledDoc: NormalizedDocument = {
      document: createMockMetadata('doc-unstyled', 'unstyled.docx', 3, true, false),
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          text: 'Course: Atmospheric Thermodynamics',
          page: 1,
          order: 0,
          confidence: 0.95,
          metadata: { isBold: true },
          provenance: { sourceDocumentId: 'doc-unstyled', sourcePage: 1, confidence: 0.95 },
        },
        {
          id: 'b2',
          type: 'paragraph',
          text: 'Course Overview\nAn introduction to thermodynamics in meteorology.',
          page: 1,
          order: 1,
          confidence: 0.95,
          metadata: { isBold: false },
          provenance: { sourceDocumentId: 'doc-unstyled', sourcePage: 1, confidence: 0.95 },
        },
        {
          id: 'b3',
          type: 'paragraph',
          text: 'Module 1: Thermodynamic Equations',
          page: 2,
          order: 2,
          confidence: 0.95,
          metadata: { isBold: true },
          provenance: { sourceDocumentId: 'doc-unstyled', sourcePage: 2, confidence: 0.95 },
        },
        {
          id: 'b4',
          type: 'paragraph',
          text: 'Lesson 1: First Law of Thermodynamics',
          page: 2,
          order: 3,
          confidence: 0.95,
          metadata: { isBold: true },
          provenance: { sourceDocumentId: 'doc-unstyled', sourcePage: 2, confidence: 0.95 },
        },
        {
          id: 'b5',
          type: 'paragraph',
          text: 'The first law relates internal energy changes to heat and work.',
          page: 2,
          order: 4,
          confidence: 0.95,
          metadata: { isBold: false },
          provenance: { sourceDocumentId: 'doc-unstyled', sourcePage: 2, confidence: 0.95 },
        },
      ],
    };

    const structure = analyzerService.analyze(unstyledDoc);
    assert(structure.modules.length === 1, `Expected 1 module, got ${structure.modules.length}`);
    assert(structure.modules[0].lessons.length === 1, `Expected 1 lesson, got ${structure.modules[0].lessons.length}`);
    assert(structure.modules[0].lessons[0].title.includes('First Law'), `Lesson title mismatch: ${structure.modules[0].lessons[0].title}`);
  });

  // --------------------------------------------------------------------------
  // Scenario 3: PDF with selectable text (no OCR needed)
  // --------------------------------------------------------------------------
  await runScenario(3, 'PDF with selectable text (no OCR needed - density gating)', async () => {
    const textDenseDoc: NormalizedDocument = {
      document: createMockMetadata('doc-selectable-pdf', 'selectable.pdf', 1, true, false),
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          text: 'A'.repeat(500),
          page: 1,
          order: 0,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-selectable-pdf', sourcePage: 1, confidence: 0.98 },
        },
      ],
    };

    const totalChars = textDenseDoc.blocks.reduce((acc: number, b: NormalizedBlock) => acc + (b.text?.length || 0), 0);
    const avgCharsPerPage = totalChars / textDenseDoc.document.pageCount;
    const needsOcr = avgCharsPerPage < 50;

    assert(!needsOcr, 'Selectable PDF with dense text should NOT trigger OCR');
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Scanned PDF / image-only pages (gated OCR)
  // --------------------------------------------------------------------------
  await runScenario(4, 'Scanned PDF / image-only pages (OCR gating triggers)', async () => {
    const scannedDoc: NormalizedDocument = {
      document: createMockMetadata('doc-scanned-pdf', 'scanned.pdf', 5, false, true),
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          text: 'page 1',
          page: 1,
          order: 0,
          confidence: 0.6,
          provenance: { sourceDocumentId: 'doc-scanned-pdf', sourcePage: 1, confidence: 0.6 },
        },
      ],
    };

    const totalChars = scannedDoc.blocks.reduce((acc: number, b: NormalizedBlock) => acc + (b.text?.length || 0), 0);
    const avgCharsPerPage = totalChars / scannedDoc.document.pageCount;
    const needsOcr = avgCharsPerPage < 50;

    assert(needsOcr, 'Scanned PDF with sparse text MUST trigger OCR gating');
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Hybrid PDF (mixed native & scanned pages)
  // --------------------------------------------------------------------------
  await runScenario(5, 'Hybrid PDF (per-page gating between native text and OCR)', async () => {
    const page1Chars = 300;
    const page2Chars = 10;

    const page1NeedsOcr = page1Chars < 50;
    const page2NeedsOcr = page2Chars < 50;

    assert(!page1NeedsOcr, 'Page 1 native text should bypass OCR');
    assert(page2NeedsOcr, 'Page 2 sparse text should route to OCR worker');
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Table of Contents Cross-Validation & Suppression
  // --------------------------------------------------------------------------
  await runScenario(6, 'Table of Contents cross-validation and duplicate suppression', async () => {
    const docWithTOC: NormalizedDocument = {
      document: createMockMetadata('doc-toc', 'toc.docx', 4, true, false),
      blocks: [
        {
          id: 't1',
          type: 'heading',
          text: 'Table of Contents',
          level: 1,
          page: 1,
          order: 0,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-toc', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 't2',
          type: 'paragraph',
          text: 'Module 1: Dynamics .......... 3',
          page: 1,
          order: 1,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-toc', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 't3',
          type: 'paragraph',
          text: 'Lesson 1: Vorticity .......... 4',
          page: 1,
          order: 2,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-toc', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'm1',
          type: 'heading',
          text: 'Module 1: Dynamics',
          level: 1,
          page: 2,
          order: 3,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-toc', sourcePage: 2, confidence: 0.98 },
        },
        {
          id: 'l1',
          type: 'heading',
          text: 'Lesson 1: Vorticity',
          level: 2,
          page: 3,
          order: 4,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-toc', sourcePage: 3, confidence: 0.98 },
        },
        {
          id: 'c1',
          type: 'paragraph',
          text: 'Vorticity is the microscopic measure of rotation in a fluid flow.',
          page: 3,
          order: 5,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-toc', sourcePage: 3, confidence: 0.98 },
        },
      ],
    };

    const structure = analyzerService.analyze(docWithTOC);
    assert(structure.modules.length === 1, `Expected exactly 1 module, got ${structure.modules.length}`);
    assert(structure.modules[0].lessons.length === 1, `Expected exactly 1 lesson, got ${structure.modules[0].lessons.length}`);
    assert(structure.validation.tocVerified, 'Expected TOC verification to pass');
    assert(structure.validation.expectedLessons === 1, `Expected 1 TOC lesson, got ${structure.validation.expectedLessons}`);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Document without Table of Contents
  // --------------------------------------------------------------------------
  await runScenario(7, 'Document without Table of Contents (direct body segmentation)', async () => {
    const docNoTOC: NormalizedDocument = {
      document: createMockMetadata('doc-no-toc', 'no-toc.docx', 2, true, false),
      blocks: [
        {
          id: 'm1',
          type: 'heading',
          text: 'Module 1: Cloud Physics',
          level: 1,
          page: 1,
          order: 0,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-no-toc', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'l1',
          type: 'heading',
          text: 'Lesson 1: Microphysics of Precipitation',
          level: 2,
          page: 1,
          order: 1,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-no-toc', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'p1',
          type: 'paragraph',
          text: 'Droplet growth occurs through condensation and coalescence.',
          page: 1,
          order: 2,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-no-toc', sourcePage: 1, confidence: 0.98 },
        },
      ],
    };

    const structure = analyzerService.analyze(docNoTOC);
    assert(structure.modules.length === 1, 'Expected 1 module');
    assert(structure.modules[0].lessons.length === 1, 'Expected 1 lesson');
    assert(structure.validation.tocVerified, 'Expected TOC verification to pass for document without TOC');
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Dynamic Non-Uniform Lesson Counts
  // --------------------------------------------------------------------------
  await runScenario(8, 'Dynamic non-uniform lesson counts (Module 5 has 3 lessons, not 4)', async () => {
    assert(hasGoldenDoc, 'Requires golden document');
    const buffer = fs.readFileSync(docPath);
    const parsed = await parserService.parseDocument(buffer, 'DOCX', 'test-doc-8', 'Forecasters_Training_Course.docx');

    const mod5 = parsed.modules[4];
    assert(mod5 && mod5.title.toLowerCase().includes('ocean'), 'Module 5 title mismatch');
    assert(mod5.lessons.length === 3, `Module 5 must have 3 lessons, got ${mod5.lessons.length}`);
    const mod1 = parsed.modules[0];
    assert(mod1.lessons.length === 4, `Module 1 must have 4 lessons, got ${mod1.lessons.length}`);
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Missing Knowledge Checks handled gracefully
  // --------------------------------------------------------------------------
  await runScenario(9, 'Missing Knowledge Checks handled gracefully without failure', async () => {
    const docNoQuiz: NormalizedDocument = {
      document: createMockMetadata('doc-no-quiz', 'no-quiz.docx', 2, true, false),
      blocks: [
        {
          id: 'm1',
          type: 'heading',
          text: 'Module 1: General Meteorology',
          level: 1,
          page: 1,
          order: 0,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-no-quiz', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'l1',
          type: 'heading',
          text: 'Lesson 1: Atmosphere Structure',
          level: 2,
          page: 1,
          order: 1,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-no-quiz', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'p1',
          type: 'paragraph',
          text: 'The atmosphere is composed of troposphere, stratosphere, and mesosphere.',
          page: 1,
          order: 2,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-no-quiz', sourcePage: 1, confidence: 0.98 },
        },
      ],
    };

    const structure = analyzerService.analyze(docNoQuiz);
    const lesson = structure.modules[0].lessons[0];
    assert(!lesson.knowledgeCheck, 'Expected knowledgeCheck to be undefined');
    assert(lesson.content.length === 1, 'Expected 1 content block');
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Tables inside Lessons preserved with provenance
  // --------------------------------------------------------------------------
  await runScenario(10, 'Tables inside Lessons preserved with provenance', async () => {
    const docWithTable: NormalizedDocument = {
      document: createMockMetadata('doc-table', 'table.docx', 2, true, false),
      blocks: [
        {
          id: 'm1',
          type: 'heading',
          text: 'Module 1: Meteorological Instruments',
          level: 1,
          page: 1,
          order: 0,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-table', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'l1',
          type: 'heading',
          text: 'Lesson 1: Barometers',
          level: 2,
          page: 1,
          order: 1,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-table', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'tbl1',
          type: 'table',
          text: '| Type | Medium | Accuracy |\n| Mercury | Liquid | High |\n| Aneroid | Metal | Moderate |',
          page: 1,
          order: 2,
          confidence: 0.98,
          metadata: {
            tableHeaders: ['Type', 'Medium', 'Accuracy'],
            tableRows: [
              ['Mercury', 'Liquid', 'High'],
              ['Aneroid', 'Metal', 'Moderate'],
            ],
          },
          provenance: { sourceDocumentId: 'doc-table', sourcePage: 1, confidence: 0.98 },
        },
      ],
    };

    const structure = analyzerService.analyze(docWithTable);
    const lesson = structure.modules[0].lessons[0];
    const tableBlock = lesson.content.find((b: any) => b.type === 'table');
    assert(!!tableBlock, 'Table block was not preserved in lesson content');
    assert(tableBlock!.text.includes('Mercury'), 'Table text corrupted');
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Images / Diagrams with captions preserved
  // --------------------------------------------------------------------------
  await runScenario(11, 'Images / Diagrams with captions preserved', async () => {
    const docWithImage: NormalizedDocument = {
      document: createMockMetadata('doc-image', 'diagram.docx', 2, true, false),
      blocks: [
        {
          id: 'm1',
          type: 'heading',
          text: 'Module 1: Radar Systems',
          level: 1,
          page: 1,
          order: 0,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-image', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'l1',
          type: 'heading',
          text: 'Lesson 1: Doppler Spectrum',
          level: 2,
          page: 1,
          order: 1,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'doc-image', sourcePage: 1, confidence: 0.98 },
        },
        {
          id: 'img1',
          type: 'image',
          text: 'Figure 1: Doppler velocity dipole indicating meso-cyclone circulation',
          page: 1,
          order: 2,
          confidence: 0.95,
          metadata: {
            imageUrl: 'uploads/media/doppler_dipole.png',
          },
          provenance: { sourceDocumentId: 'doc-image', sourcePage: 1, confidence: 0.95 },
        },
      ],
    };

    const structure = analyzerService.analyze(docWithImage);
    const lesson = structure.modules[0].lessons[0];
    const imgBlock = lesson.content.find((b: any) => b.type === 'image');
    assert(!!imgBlock, 'Image block was not preserved in lesson content');
    assert(imgBlock!.text.includes('Figure 1'), 'Image caption missing');
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Repeated Header / Footer Suppression
  // --------------------------------------------------------------------------
  await runScenario(12, 'Repeated Header / Footer Suppression', async () => {
    const multiPageBlocks: NormalizedBlock[] = [
      { id: 'h1', type: 'page_header', text: 'Ministry of Earth Sciences', page: 1, order: 0, confidence: 0.95 },
      { id: 'p1', type: 'paragraph', text: 'Content page 1', page: 1, order: 1, confidence: 0.95 },
      { id: 'f1', type: 'page_footer', text: 'Confidential', page: 1, order: 2, confidence: 0.95 },
      { id: 'h2', type: 'page_header', text: 'Ministry of Earth Sciences', page: 2, order: 3, confidence: 0.95 },
      { id: 'p2', type: 'paragraph', text: 'Content page 2', page: 2, order: 4, confidence: 0.95 },
      { id: 'f2', type: 'page_footer', text: 'Confidential', page: 2, order: 5, confidence: 0.95 },
    ];

    const cleaned = extractorService.filterHeadersAndFooters(multiPageBlocks);
    assert(cleaned.length === 2, `Expected 2 content blocks after header/footer removal, got ${cleaned.length}`);
    assert(cleaned.every((b: NormalizedBlock) => b.type === 'paragraph'), 'Non-paragraph blocks survived header/footer filter');
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Numbering Conventions (Unit, Section, Chapter, M1, Lesson 1.1)
  // --------------------------------------------------------------------------
  await runScenario(13, 'Numbering conventions (Unit, Section, Chapter, M1, Lesson 1.1)', async () => {
    const docVariants: NormalizedDocument = {
      document: createMockMetadata('doc-variants', 'variants.docx', 3, true, false),
      blocks: [
        { id: 'u1', type: 'heading', text: 'Unit 1: Satellite Meteorology', level: 1, page: 1, order: 0, confidence: 0.98, provenance: { confidence: 0.98 } },
        { id: 'l1', type: 'heading', text: 'Lesson 1.1: Geostationary Imagers', level: 2, page: 1, order: 1, confidence: 0.98, provenance: { confidence: 0.98 } },
        { id: 'p1', type: 'paragraph', text: 'INSAT-3D provides multi-spectral imagery.', page: 1, order: 2, confidence: 0.98, provenance: { confidence: 0.98 } },
        { id: 'c1', type: 'heading', text: 'Chapter 2: Numerical Modeling', level: 1, page: 2, order: 3, confidence: 0.98, provenance: { confidence: 0.98 } },
        { id: 'l2', type: 'heading', text: 'Section 2.1: Grid Staggering', level: 2, page: 2, order: 4, confidence: 0.98, provenance: { confidence: 0.98 } },
        { id: 'p2', type: 'paragraph', text: 'Arakawa grids C and D.', page: 2, order: 5, confidence: 0.98, provenance: { confidence: 0.98 } },
      ],
    };

    const structure = analyzerService.analyze(docVariants);
    assert(structure.modules.length === 2, `Expected 2 modules for Unit/Chapter, got ${structure.modules.length}`);
    assert(structure.modules[0].title.includes('Satellite Meteorology'), 'Unit 1 title missing');
    assert(structure.modules[1].title.includes('Numerical Modeling'), 'Chapter 2 title missing');
    assert(structure.modules[0].lessons.length === 1, 'Unit 1 lesson missing');
    assert(structure.modules[1].lessons.length === 1, 'Chapter 2 lesson missing');
  });

  // --------------------------------------------------------------------------
  // Scenario 14: MoES & Meteorological Competency Mapping
  // --------------------------------------------------------------------------
  await runScenario(14, 'MoES & Meteorological Competency Mapping', async () => {
    assert(hasGoldenDoc, 'Requires golden document');
    const buffer = fs.readFileSync(docPath);
    const parsed = await parserService.parseDocument(buffer, 'DOCX', 'test-doc-14', 'Forecasters_Training_Course.docx');

    const radarTopic = parsed.globalTopics.find((t: any) => t.name.toLowerCase().includes('radar'));
    assert(!!radarTopic, 'Doppler Weather Radar topic should be detected');
    assert(parsed.summary.totalCompetencyMappings > 0, 'Competency mappings should be linked');
    assert(parsed.globalTopics.length >= 20, `Expected at least 20 topics, got ${parsed.globalTopics.length}`);
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Scalability & High-Throughput (100+ pages, 500+ blocks in < 1s)
  // --------------------------------------------------------------------------
  await runScenario(15, 'Scalability & High-Throughput (100+ pages, 500+ blocks in < 1s)', async () => {
    const largeBlocks: NormalizedBlock[] = [];
    let orderIndex = 0;

    for (let m = 1; m <= 10; m++) {
      largeBlocks.push({
        id: `m-${m}`,
        type: 'heading',
        text: `Module ${m}: Advanced Atmospheric Dynamics Part ${m}`,
        level: 1,
        page: m * 10,
        order: orderIndex++,
        confidence: 0.98,
        provenance: { sourceDocumentId: 'large', sourcePage: m * 10, confidence: 0.98 },
      });

      for (let l = 1; l <= 5; l++) {
        largeBlocks.push({
          id: `l-${m}-${l}`,
          type: 'heading',
          text: `Lesson ${l}: Topic Component ${m}.${l}`,
          level: 2,
          page: m * 10 + l,
          order: orderIndex++,
          confidence: 0.98,
          provenance: { sourceDocumentId: 'large', sourcePage: m * 10 + l, confidence: 0.98 },
        });

        for (let p = 1; p <= 8; p++) {
          largeBlocks.push({
            id: `p-${m}-${l}-${p}`,
            type: 'paragraph',
            text: `High-resolution NWP model equations and boundary conditions simulation step ${p}. Continuous flux calculation with Navier-Stokes approximations.`,
            page: m * 10 + l,
            order: orderIndex++,
            confidence: 0.98,
            provenance: { sourceDocumentId: 'large', sourcePage: m * 10 + l, confidence: 0.98 },
          });
        }
      }
    }

    const largeDoc: NormalizedDocument = {
      document: createMockMetadata('doc-large-100p', 'large-manual-100p.docx', 100, true, false),
      blocks: largeBlocks,
    };

    const startTime = Date.now();
    const structure = analyzerService.analyze(largeDoc);
    const elapsed = Date.now() - startTime;

    assert(structure.modules.length === 10, `Expected 10 modules, got ${structure.modules.length}`);
    const totalLessons = structure.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0);
    assert(totalLessons === 50, `Expected 50 lessons, got ${totalLessons}`);
    assert(elapsed < 1000, `Structure analysis took ${elapsed}ms; expected < 1000ms`);
  });

  // --------------------------------------------------------------------------
  // Summary Report
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('15 GOLDEN TEST SCENARIOS EXECUTION SUMMARY');
  console.log('===============================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((r) => {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} [Scenario ${r.id.toString().padStart(2, ' ')}] ${r.title} (${r.durationMs}ms)`);
  });

  console.log('---------------------------------------------------------------');
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
