/**
 * File Parser Service
 * Extracts text content from uploaded files for KB ingestion
 * Supports: .txt, .md, .pdf, .json, .csv, .html, .xml, .c, .h, .cpp, .py, .js, .ts, .yaml, .yml, .rst, .log,
 *           .docx, .xlsx, .pptx (Office), .png, .jpg, .jpeg, .tiff, .bmp (OCR)
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// Supported file extensions and their MIME types
const SUPPORTED_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.rst', '.log',
  '.pdf',
  '.json', '.csv', '.tsv',
  '.html', '.htm', '.xml',
  '.c', '.h', '.cpp', '.hpp', '.py', '.js', '.ts', '.java', '.rs', '.go',
  '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.sh', '.bat', '.ps1',
  '.arxml', '.dbc', '.a2l',  // Automotive-specific
  '.docx', '.xlsx', '.pptx', // Office formats
  '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif', // Images (OCR)
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTENT_LENGTH = 50000; // Max characters to store (prevents oversized payloads)

function isSupportedFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.html', '.htm'].includes(ext)) return 'html';
  if (['.json'].includes(ext)) return 'json';
  if (['.csv', '.tsv'].includes(ext)) return 'csv';
  if (['.xml', '.arxml'].includes(ext)) return 'xml';
  if (ext === '.docx') return 'docx';
  if (ext === '.xlsx') return 'xlsx';
  if (ext === '.pptx') return 'pptx';
  if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'].includes(ext)) return 'image';
  return 'text';
}

// Strip HTML tags (reuse from infohub pattern)
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * Extract text content from a file buffer
 * @param {Buffer} buffer - File contents
 * @param {string} filename - Original filename (for type detection)
 * @returns {Promise<string>} Extracted text
 */
async function extractText(buffer, filename) {
  const fileType = getFileType(filename);
  let text;

  switch (fileType) {
    case 'pdf':
      text = await extractPDF(buffer);
      break;
    case 'html':
      text = stripHtml(buffer.toString('utf-8'));
      break;
    case 'json':
      text = extractJSON(buffer);
      break;
    case 'xml':
      text = extractXML(buffer);
      break;
    case 'docx':
      text = await extractDOCX(buffer);
      break;
    case 'xlsx':
      text = await extractXLSX(buffer);
      break;
    case 'pptx':
      text = await extractPPTX(buffer);
      break;
    case 'image':
      text = await extractImageOCR(buffer, filename);
      break;
    default:
      text = buffer.toString('utf-8').trim();
  }

  // Enforce content length limit
  if (text && text.length > MAX_CONTENT_LENGTH) {
    text = text.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated at ' + MAX_CONTENT_LENGTH + ' characters]';
  }
  return text;
}

async function extractPDF(buffer) {
  try {
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    const text = (result.text || '').trim();
    // Strip pdf-parse page separators (e.g. "-- 1 of 5 --") to measure actual content
    const contentOnly = text.replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').replace(/\s+/g, ' ').trim();
    // If actual content is sparse, it's likely a scanned/image-based PDF — try OCR
    if (contentOnly.length < 100) {
      console.log(`[PDF] getText produced ${contentOnly.length} chars of content, attempting OCR...`);
      const ocrText = await extractPDFWithOCR(buffer);
      if (ocrText && !ocrText.startsWith('[') && ocrText.length > contentOnly.length) return ocrText;
    }
    return text;
  } catch (err) {
    console.warn('PDF parse failed, attempting OCR fallback:', err.message);
    return extractPDFWithOCR(buffer);
  }
}

// Render PDF pages to images then OCR them (for image-based/scanned PDFs)
async function extractPDFWithOCR(buffer) {
  try {
    const { PDFParse } = require('pdf-parse');
    const Tesseract = require('tesseract.js');
    const parser = new PDFParse({ data: buffer });
    const info = await parser.getInfo();
    const pageCount = Math.min(info.total || info.numPages || 1, 10); // Limit to 10 pages
    console.log(`[PDF OCR] Processing ${pageCount} pages...`);

    // Render all pages to PNG image buffers in one call
    const screenshotResult = await parser.getScreenshot({
      imageBuffer: true,
      scale: 2, // Higher scale for better OCR accuracy
    });

    const texts = [];
    const pages = (screenshotResult && screenshotResult.pages) || [];
    for (const page of pages) {
      if (page.pageNumber > pageCount) break;
      try {
        // page.data is a Uint8Array containing PNG image bytes
        if (page.data && page.data.length > 0) {
          const imgBuffer = Buffer.from(page.data);
          const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng', {
            logger: () => {},
          });
          if (text && text.trim()) texts.push(text.trim());
        }
      } catch (pageErr) {
        console.warn(`OCR failed for PDF page ${page.pageNumber}:`, pageErr.message);
      }
    }

    await parser.destroy();
    const raw = texts.join('\n\n').trim();
    return cleanOCRText(raw) || '[OCR produced no readable text from PDF]';
  } catch (err) {
    console.warn('PDF OCR fallback failed:', err.message);
    return '[Could not extract text from image-based PDF]';
  }
}

/**
 * Clean up OCR text by removing garbled lines produced from logos,
 * table borders, images, and other non-text visual elements.
 */
function cleanOCRText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const cleaned = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1] !== '') {
        cleaned.push('');
      }
      continue;
    }

    // Skip lines with 4+ consecutive identical letters (OCR artifacts from dotted leaders, borders)
    if (/([a-zA-Z])\1{3,}/.test(trimmed)) continue;

    // Skip words/lines with excessive consecutive consonants (garbled OCR output)
    // e.g. "sviiciminciauasasmaacanstusassstasictbsssonsotoss"
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(trimmed)) continue;

    // Skip lines that are a single long garbled token (no spaces, 30+ chars, low vowel ratio)
    if (trimmed.length >= 30 && !trimmed.includes(' ')) {
      const vowels = (trimmed.match(/[aeiou]/gi) || []).length;
      const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
      if (letters > 0 && vowels / letters < 0.15) continue;
    }

    // Split into words and analyze
    const words = trimmed.split(/\s+/);
    // "Real" words: 3+ alphabetic characters
    const realWords = words.filter(w => (w.match(/[a-zA-Z]/g) || []).length >= 3);

    // Skip lines where most words are garbled (contain 5+ consecutive consonants)
    if (words.length >= 2) {
      const garbledWords = words.filter(w => /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(w));
      if (garbledWords.length / words.length > 0.4) continue;
    }

    // For short lines (< 30 chars): require at least one real word
    if (trimmed.length < 30 && realWords.length === 0) continue;

    // Very short lines (< 20 chars) need a substantial word to be meaningful
    if (trimmed.length < 20) {
      const hasLongWord = words.some(w => (w.match(/[a-zA-Z]/g) || []).length >= 5);
      if (!hasLongWord && realWords.length < 2) continue;
    }

    // For all lines: need at least 25% real words (catches random single-char fragment lines)
    if (words.length >= 3 && realWords.length / words.length < 0.25) continue;

    // Short lines (< 40 chars) with mostly short ALL-CAPS words are OCR noise from table cells
    if (trimmed.length < 40) {
      const shortCapsWords = words.filter(w => /^[A-Z]{1,4}$/.test(w.replace(/[^a-zA-Z]/g, '')));
      if (words.length >= 3 && shortCapsWords.length / words.length > 0.6) continue;
    }

    cleaned.push(trimmed);
  }
  // Remove leading/trailing blank lines
  while (cleaned.length > 0 && cleaned[0] === '') cleaned.shift();
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === '') cleaned.pop();
  return cleaned.join('\n');
}

// ── Office format extractors ────────────────────────────

async function extractDOCX(buffer) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || '').trim();
  } catch (err) {
    console.warn('DOCX extraction failed:', err.message);
    return '[Could not extract text from DOCX file]';
  }
}

async function extractXLSX(buffer) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const lines = [];
    for (const sheetName of workbook.SheetNames) {
      lines.push(`--- Sheet: ${sheetName} ---`);
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      lines.push(csv);
    }
    return lines.join('\n').trim();
  } catch (err) {
    console.warn('XLSX extraction failed:', err.message);
    return '[Could not extract text from XLSX file]';
  }
}

async function extractPPTX(buffer) {
  try {
    const JSZip = require('jszip');
    const zip = await JSZip.loadAsync(buffer);
    const slides = [];
    // PPTX is a ZIP; slide XML lives in ppt/slides/slide*.xml
    const slideFiles = Object.keys(zip.files)
      .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort();
    for (const slideFile of slideFiles) {
      const xml = await zip.files[slideFile].async('string');
      // Strip XML tags, keep text
      const text = xml
        .replace(/<a:t>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (text) slides.push(text);
    }
    return slides.join('\n\n').trim() || '[No text content found in PPTX]';
  } catch (err) {
    console.warn('PPTX extraction failed:', err.message);
    return '[Could not extract text from PPTX file]';
  }
}

// ── OCR (Tesseract) ─────────────────────────────────────

async function extractImageOCR(buffer, filename) {
  try {
    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {},  // suppress progress logs
    });
    return (text || '').trim() || '[OCR produced no readable text]';
  } catch (err) {
    console.warn('OCR extraction failed:', err.message);
    return '[OCR not available — install tesseract.js for image text extraction]';
  }
}

function extractJSON(buffer) {
  try {
    const obj = JSON.parse(buffer.toString('utf-8'));
    // Pretty-print for readability
    return JSON.stringify(obj, null, 2);
  } catch {
    return buffer.toString('utf-8');
  }
}

function extractXML(buffer) {
  const text = buffer.toString('utf-8');
  // Strip XML tags but keep text content
  return text
    .replace(/<\?xml[^?]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

module.exports = {
  extractText,
  isSupportedFile,
  getFileType,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_CONTENT_LENGTH,
};
