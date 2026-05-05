/**
 * File Parser Service
 * Extracts text content from uploaded files for KB ingestion
 * Supports: .txt, .md, .pdf, .json, .csv, .html, .xml, .c, .h, .cpp, .py, .js, .ts, .yaml, .yml, .rst, .log
 */

const fs = require('fs');
const path = require('path');

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
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  switch (fileType) {
    case 'pdf':
      return extractPDF(buffer);
    case 'html':
      return stripHtml(buffer.toString('utf-8'));
    case 'json':
      return extractJSON(buffer);
    case 'xml':
      return extractXML(buffer);
    default:
      return buffer.toString('utf-8').trim();
  }
}

async function extractPDF(buffer) {
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || '';
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
};
