/**
 * Arovia.AI — Extra Sources Preprocessor
 * =====================================
 * Converts Desktop PDFs, Excel spreadsheets, DOCX text, CSV files, and
 * ALL PDF books in "NewBooks 2" & "NewBooks 2_needs_ocr" into .jsonl files
 * inside data/new_sources/processed/ so the Brain master re-ingestor ingests them.
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';

const PROCESSED_DIR = path.resolve('data/new_sources/processed');
const DESKTOP_DIR = 'C:\\Users\\JATIN\\Desktop';

if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

interface KnowledgeChunk {
  title: string;
  source: string;
  text: string;
  category: string;
  metadata?: Record<string, any>;
}

function writeJsonl(filename: string, chunks: KnowledgeChunk[]) {
  if (chunks.length === 0) return;
  const filePath = path.join(PROCESSED_DIR, filename);
  const content = chunks.map(c => JSON.stringify(c)).join('\n');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Created ${filename} (${chunks.length} chunks)`);
}

function chunkText(text: string, title: string, source: string, category: string, maxChunkLen = 1200): KnowledgeChunk[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 30);

  const chunks: KnowledgeChunk[] = [];
  let currentBuffer = '';

  for (const para of paragraphs) {
    if ((currentBuffer + '\n\n' + para).length > maxChunkLen) {
      if (currentBuffer.length > 30) {
        chunks.push({
          title,
          source,
          text: currentBuffer.trim(),
          category,
        });
      }
      currentBuffer = para;
    } else {
      currentBuffer = currentBuffer ? currentBuffer + '\n\n' + para : para;
    }
  }

  if (currentBuffer.length > 30) {
    chunks.push({
      title,
      source,
      text: currentBuffer.trim(),
      category,
    });
  }

  return chunks;
}

async function processPdfDirectory(dirPath: string, categoryPrefix: string) {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    console.warn(`⚠️ Directory not found: ${resolved}`);
    return;
  }

  const files = fs.readdirSync(resolved);
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.pdf')) continue;
    const fullPath = path.join(resolved, file);

    try {
      const dataBuffer = fs.readFileSync(fullPath);
      const parsed = await pdfParse(dataBuffer);

      if (!parsed.text || parsed.text.trim().length < 50) {
        console.warn(`⚠️ Low/No text extracted (OCR needed) for: ${file}`);
        continue;
      }

      const baseName = path.basename(file, '.pdf').replace(/[^a-zA-Z0-9_]/g, '_');
      const chunks = chunkText(
        parsed.text,
        baseName.replace(/_/g, ' '),
        `Book PDF: ${file}`,
        `${categoryPrefix} - Ayurvedic Reference Book`
      );

      writeJsonl(`pdf_book_${baseName}.jsonl`, chunks);
    } catch (err: any) {
      console.error(`❌ Error reading ${file}:`, err.message);
    }
  }
}

async function processDesktopPdfs() {
  console.log('--- Processing Desktop PDFs ---');
  const pdfFiles = [
    'Arovia_AI_Chatbot_Architecture_DeepDive.pdf',
    'Arovia_AI_Investor_Pitch_QA_Guide.pdf',
    'Arovia_AI_Master_Investor_Dossier.pdf',
    'Arovia_AI_Math_RAG_Code_DeepDive.pdf',
    'Arovia_AI_Plain_English_Tech_Guide.pdf',
    'Arovia_AI_Technical_Architecture.pdf',
    'Arovia.AI - Science Meets Soul.pdf',
    'Pitch Deck.pdf',
    'RESEARCH PUBLICATIONS IN AYURVEDIC SCIENCES.pdf',
    'Workflow.pdf',
  ];

  for (const pdfName of pdfFiles) {
    const fullPath = path.join(DESKTOP_DIR, pdfName);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found: ${fullPath}`);
      continue;
    }

    try {
      const dataBuffer = fs.readFileSync(fullPath);
      const parsed = await pdfParse(dataBuffer);
      const baseName = path.basename(pdfName, '.pdf').replace(/[^a-zA-Z0-9_]/g, '_');
      const category = pdfName.toLowerCase().includes('ayurvedic')
        ? 'Ayurvedic Research'
        : pdfName.toLowerCase().includes('arovia') || pdfName.toLowerCase().includes('arovia')
        ? 'Platform Architecture & Dossier'
        : 'Medical Document';

      const chunks = chunkText(parsed.text, baseName.replace(/_/g, ' '), `Desktop PDF: ${pdfName}`, category);
      writeJsonl(`pdf_${baseName}.jsonl`, chunks);
    } catch (err: any) {
      console.error(`❌ Error reading ${pdfName}:`, err.message);
    }
  }
}

function processExcelFiles() {
  console.log('--- Processing Excel Files ---');
  const excelFiles = [
    { file: 'data/spreadsheets/cure_minor.xlsx', name: 'cure_minor', category: 'Minor Ailments & Remedies' },
    { file: 'data/spreadsheets/Essential_Medicines_List_2013_Delhi.xlsx', name: 'essential_medicines_delhi', category: 'Essential Medicines List' },
    { file: 'GGG/Arovia_AI_Audit_Data.xlsx', name: 'arovia_audit_data', category: 'Audit Data' },
  ];

  for (const item of excelFiles) {
    const fullPath = path.resolve(item.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Excel file not found: ${fullPath}`);
      continue;
    }

    try {
      const wb = XLSX.readFile(fullPath);
      const allChunks: KnowledgeChunk[] = [];

      for (const sheetName of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[sheetName]);
        rows.forEach((row, idx) => {
          const rowStr = Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');

          if (rowStr.length > 15) {
            allChunks.push({
              title: `${item.name} - ${sheetName} (Row ${idx + 1})`,
              source: `Excel: ${path.basename(item.file)} - ${sheetName}`,
              text: rowStr,
              category: item.category,
              metadata: { sheet: sheetName, row: idx + 1 },
            });
          }
        });
      }

      writeJsonl(`excel_${item.name}.jsonl`, allChunks);
    } catch (err: any) {
      console.error(`❌ Error reading Excel ${item.file}:`, err.message);
    }
  }
}

function processAyushCsv() {
  console.log('--- Processing ayush_articles.csv ---');
  const csvPath = path.resolve('ayush_articles.csv');
  if (fs.existsSync(csvPath)) {
    try {
      const wb = XLSX.readFile(csvPath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      const chunks: KnowledgeChunk[] = [];

      rows.forEach((row, idx) => {
        const text = Object.entries(row)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        if (text.length > 20) {
          chunks.push({
            title: row.title || row.Title || `AYUSH Article ${idx + 1}`,
            source: 'ayush_articles.csv',
            text,
            category: 'AYUSH Articles & Research',
          });
        }
      });

      writeJsonl('csv_ayush_articles.jsonl', chunks);
    } catch (err: any) {
      console.error('❌ Error reading ayush_articles.csv:', err.message);
    }
  }
}

function processDocxText() {
  console.log('--- Processing DOCX Text ---');
  const docxTxtPath = path.resolve('GGG/docx_text.txt');
  if (fs.existsSync(docxTxtPath)) {
    const text = fs.readFileSync(docxTxtPath, 'utf-8');
    const chunks = chunkText(text, 'Arovia AI Comprehensive Audit Document', 'GGG/Arovia_AI_Comprehensive_Audit.docx', 'Platform Audit');
    writeJsonl('docx_arovia_comprehensive_audit.jsonl', chunks);
  }
}

async function main() {
  console.log('🚀 Preparing ALL data sources (Desktop + NewBooks 2 + CCRAS + Excel + CSV) for Brain ingestion...');
  await processDesktopPdfs();
  console.log('--- Processing NewBooks 2 ---');
  await processPdfDirectory('NewBooks 2', 'NewBooks 2');
  console.log('--- Processing NewBooks 2_needs_ocr ---');
  await processPdfDirectory('NewBooks 2_needs_ocr', 'CCRAS Publications');
  processExcelFiles();
  processAyushCsv();
  processDocxText();
  console.log('🎉 ALL data sources successfully prepared into JSONL vector chunks!');
}

main().catch(err => {
  console.error('Fatal error in prepare_extra_sources:', err);
  process.exit(1);
});
