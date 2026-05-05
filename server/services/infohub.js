/**
 * InfoHub (Confluence) Connector
 * Fetches content from EB InfoHub via Confluence REST API
 * Uses Personal Access Token (PAT) for authentication
 */

const { addKBArticle } = require('./qdrant');

const INFOHUB_BASE = 'https://infohub.automotive.elektrobit.com';

// Strip HTML tags and clean up Confluence content — deep noise removal
function stripHtml(html) {
  if (!html) return '';
  return html
    // Remove non-content blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    // Remove Confluence macros (TOC, status, panels, expand, info, note, warning)
    .replace(/<ac:structured-macro[^>]*ac:name="toc"[^>]*>[\s\S]*?<\/ac:structured-macro>/gi, '')
    .replace(/<ac:structured-macro[^>]*ac:name="status"[^>]*>[\s\S]*?<\/ac:structured-macro>/gi, '')
    .replace(/<ac:structured-macro[^>]*ac:name="expand"[^>]*>[\s\S]*?<\/ac:structured-macro>/gi, '')
    .replace(/<ac:structured-macro[^>]*>[\s\S]*?<\/ac:structured-macro>/gi, '')
    .replace(/<ac:[^>]+\/>/gi, '')
    .replace(/<ac:[^>]+>/gi, '')
    .replace(/<\/ac:[^>]+>/gi, '')
    .replace(/<ri:[^>]+\/>/gi, '')
    .replace(/<ri:[^>]+>[\s\S]*?<\/ri:[^>]+>/gi, '')
    // Convert headings to markdown-style
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, level, text) => '\n\n' + '#'.repeat(parseInt(level)) + ' ' + text.replace(/<[^>]+>/g, '').trim() + '\n\n')
    // Structure
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<th[^>]*>/gi, ' | **')
    .replace(/<\/th>/gi, '** ')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<\/td>/gi, ' ')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Entity decode
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    // Clean whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^\s+$/gm, '')
    .trim();
}

// Make authenticated request to Confluence API
async function confluenceRequest(path, token) {
  const url = `${INFOHUB_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    redirect: 'manual', // Don't follow redirects (SSO login redirects)
  });
  // Handle SSO redirects (302 to login page)
  if (res.status === 302 || res.status === 301) {
    throw new Error('Session expired or insufficient permissions');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Confluence API ${res.status}: ${text.substring(0, 200)}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Unexpected response (not JSON) - session may have expired');
  }
  return res.json();
}

// Fetch all spaces
async function fetchSpaces(token) {
  const data = await confluenceRequest('/rest/api/space?limit=500&type=global', token);
  return (data.results || []).map(s => ({
    key: s.key,
    name: s.name,
    type: s.type,
    description: s.description?.plain?.value || '',
    url: `${INFOHUB_BASE}/display/${s.key}`,
  }));
}

// Fetch pages in a space
async function fetchSpacePages(token, spaceKey, limit = 50) {
  const data = await confluenceRequest(
    `/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&type=page&limit=${limit}&expand=body.storage,version,ancestors,space,metadata.labels`,
    token
  );
  return (data.results || []).map(p => ({
    id: p.id,
    title: p.title,
    spaceKey: p.space?.key || spaceKey,
    spaceName: p.space?.name || spaceKey,
    body: stripHtml(p.body?.storage?.value || ''),
    version: p.version?.number || 1,
    lastUpdated: p.version?.when || '',
    lastUpdatedBy: p.version?.by?.displayName || '',
    labels: (p.metadata?.labels?.results || []).map(l => l.name),
    url: `${INFOHUB_BASE}/pages/viewpage.action?pageId=${p.id}`,
    ancestors: (p.ancestors || []).map(a => a.title),
  }));
}

// ── EB-aware keyword & phrase extraction ─────────────────

// Known EB product names and compound terms to keep together
const EB_COMPOUNDS = [
  'eb tresos', 'eb corbos', 'eb guide', 'eb assist', 'eb cadian', 'eb zoneo',
  'eb tresos studio', 'eb corbos linux', 'eb corbos hypervisor', 'eb corbos adaptivecore',
  'adaptive autosar', 'classic autosar', 'autosar bsw', 'autosar adaptive',
  'basic software', 'functional safety', 'iso 26262', 'iso 21434',
  'misra c', 'misra cpp', 'over the air', 'ota update',
  'high performance computing', 'hpc', 'software defined vehicle',
  'electronic control unit', 'ecu', 'hardware in the loop', 'hil',
  'continuous integration', 'ci cd',
];

function extractKeywords(query) {
  const stopWords = new Set([
    'what', 'is', 'are', 'was', 'were', 'how', 'do', 'does', 'did', 'can', 'could',
    'will', 'would', 'should', 'shall', 'may', 'might', 'must', 'to', 'the', 'a',
    'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'of', 'with', 'by', 'from',
    'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'because', 'as', 'until', 'while', 'this', 'that', 'these', 'those',
    'it', 'its', 'my', 'me', 'we', 'us', 'you', 'your', 'tell', 'give', 'use',
    'using', 'used', 'also', 'which', 'who', 'whom', 'been', 'being', 'have', 'has',
    'had', 'having', 'need', 'know', 'please', 'help', 'explain', 'describe',
    'details', 'information', 'overview', 'work', 'works', 'working',
  ]);

  const lower = query.toLowerCase().replace(/[^a-z0-9\s/-]/g, '');

  // 1. Extract compound phrases first
  const phrases = [];
  let remaining = lower;
  for (const compound of EB_COMPOUNDS.sort((a, b) => b.length - a.length)) {
    if (remaining.includes(compound)) {
      phrases.push(compound);
      remaining = remaining.replace(compound, ' ');
    }
  }

  // 2. Extract individual keywords from what's left
  const words = remaining.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  // Combine: phrases first (higher value), then individual keywords
  const all = [...phrases, ...words];
  return all.length > 0 ? all : query.toLowerCase().split(/\s+/).slice(0, 3);
}

// ── Advanced Relevance Scoring ───────────────────────────

function scoreResult(result, keywords, originalQuery) {
  const titleLower = result.title.toLowerCase();
  const bodyLower = result.body.toLowerCase();
  const queryLower = (originalQuery || '').toLowerCase();
  let score = 0;

  // --- Title scoring (highest weight) ---
  // Exact query in title
  if (queryLower && titleLower.includes(queryLower)) score += 200;

  for (const kw of keywords) {
    // Compound phrase in title (very high)
    if (kw.includes(' ') && titleLower.includes(kw)) score += 100;
    // Single keyword in title
    else if (titleLower.includes(kw)) score += 50;
    // Word boundary match in title (e.g., "tresos" not "tresosxyz")
    if (new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(titleLower)) score += 25;
  }

  // --- Body scoring (keyword density with diminishing returns) ---
  const bodySnippet = bodyLower.substring(0, 10000);
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = (bodySnippet.match(new RegExp(escaped, 'g')) || []).length;
    // Diminishing returns: first 5 matches worth more than next 5
    score += Math.min(matches, 5) * 4 + Math.min(Math.max(matches - 5, 0), 10) * 1;

    // Keyword in first 500 chars (intro paragraph) = extra boost
    if (bodyLower.substring(0, 500).includes(kw)) score += 15;
  }

  // --- Content quality signals ---
  const bodyLen = result.body.length;
  if (bodyLen > 500) score += 5;
  if (bodyLen > 2000) score += 10;
  if (bodyLen > 5000) score += 10;
  if (bodyLen > 10000) score += 5;
  // Penalize stubs and near-empty pages
  if (bodyLen < 100) score -= 50;
  if (bodyLen < 50) score -= 100;

  // --- Labels match ---
  if (result.labels && result.labels.length > 0) {
    for (const kw of keywords) {
      if (result.labels.some(l => l.toLowerCase().includes(kw))) score += 20;
    }
  }

  result.relevanceScore = score;
  return result;
}

// ── Smart paragraph extraction (TF-IDF-like) ────────────

function extractRelevantContent(body, keywords, maxChars = 6000) {
  if (!body || body.length <= maxChars) return body || '';

  // Split into meaningful blocks (paragraphs, sections)
  const blocks = body.split(/\n\n+/).filter(p => p.trim().length > 20);
  if (blocks.length === 0) return body.substring(0, maxChars);

  // Compute keyword frequency across entire document for IDF-like weighting
  const docLower = body.toLowerCase();
  const kwDocFreq = {};
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    kwDocFreq[kw] = (docLower.match(new RegExp(escaped, 'g')) || []).length || 1;
  }
  const totalKwMentions = Object.values(kwDocFreq).reduce((a, b) => a + b, 0);

  // Score each block
  const scored = blocks.map((block, idx) => {
    const lower = block.toLowerCase();
    let blockScore = 0;

    for (const kw of keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tf = (lower.match(new RegExp(escaped, 'g')) || []).length;
      // IDF-like: keywords that appear less often in the doc are more valuable per-block
      const idf = Math.log(1 + totalKwMentions / kwDocFreq[kw]);
      blockScore += tf * idf * (kw.includes(' ') ? 3 : 1); // Boost compound phrases
    }

    // Boost headings
    if (/^#{1,4} /.test(block.trim())) blockScore += 8;
    // Boost first 3 blocks (usually intro/summary)
    if (idx < 3) blockScore += 5;
    // Boost bulleted lists (often contain key information)
    if (block.includes('• ') || block.includes('- ')) blockScore += 3;

    return { text: block, score: blockScore, idx };
  });

  // Always include intro (first 2 blocks if they exist)
  const intro = scored.filter(s => s.idx < 2);
  const rest = scored.filter(s => s.idx >= 2).sort((a, b) => b.score - a.score);

  let content = intro.map(s => s.text).join('\n\n');
  for (const block of rest) {
    if (block.score <= 0) continue;
    if (content.length + block.text.length + 2 > maxChars) {
      // Try to fit a truncated version if the block is really relevant
      if (block.score > 10 && content.length + 500 < maxChars) {
        content += '\n\n' + block.text.substring(0, maxChars - content.length - 2);
      }
      continue;
    }
    content += '\n\n' + block.text;
  }

  return content;
}

// ── Multi-Strategy Confluence Search (Parallel) ─────────

async function searchInfoHub(token, query, limit = 25) {
  const t0 = Date.now();
  const keywords = extractKeywords(query);

  const phrases = keywords.filter(k => k.includes(' '));
  const singles = keywords.filter(k => !k.includes(' '));

  // Primary search term: best compound phrase or top keywords
  const primaryPhrase = phrases[0] || singles.slice(0, 3).join(' ');

  const mapPage = p => ({
    id: p.id,
    title: p.title,
    spaceKey: p.space?.key || '',
    spaceName: p.space?.name || '',
    body: stripHtml(p.body?.storage?.value || ''),
    version: p.version?.number || 1,
    lastUpdated: p.version?.when || '',
    lastUpdatedBy: p.version?.by?.displayName || '',
    labels: (p.metadata?.labels?.results || []).map(l => l.name),
    url: `${INFOHUB_BASE}/pages/viewpage.action?pageId=${p.id}`,
  });

  const seen = new Set();
  const results = [];
  const addResults = (data) => {
    if (!data || !data.results) return;
    for (const p of data.results) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        results.push(mapPage(p));
      }
    }
  };

  const expand = 'body.storage,version,space,metadata.labels';

  // Helper: safe CQL fetch that never throws
  const safeCql = async (cql, lim) => {
    try {
      return await confluenceRequest(
        `/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${lim}&expand=${expand}`,
        token
      );
    } catch { return null; }
  };

  // Run title + text searches in PARALLEL for speed
  const searches = [
    safeCql(`type=page AND title~"${primaryPhrase}"`, 10),             // Fuzzy title
    safeCql(`type=page AND text~"${primaryPhrase}"`, Math.min(limit, 15)), // Full-text
  ];

  // Add a secondary keyword search if we have extra terms
  if (singles.length > 1) {
    const secondary = singles.slice(0, 3).join(' ');
    if (secondary !== primaryPhrase) {
      searches.push(safeCql(`type=page AND title~"${secondary}"`, 5));
    }
  }

  const searchResults = await Promise.all(searches);
  searchResults.forEach(r => { if (r) addResults(r); });

  // Score and rank results by relevance
  results.forEach(r => scoreResult(r, keywords, query));
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`[InfoHub] ${results.length} results in ${Date.now() - t0}ms for: "${primaryPhrase}" (keywords: ${keywords.join(', ')})`);

  return results;
}

// Fetch a single page with full body
async function fetchPage(token, pageId) {
  const data = await confluenceRequest(
    `/rest/api/content/${pageId}?expand=body.storage,version,space,metadata.labels,children.page`,
    token
  );
  return {
    id: data.id,
    title: data.title,
    spaceKey: data.space?.key || '',
    spaceName: data.space?.name || '',
    body: stripHtml(data.body?.storage?.value || ''),
    version: data.version?.number || 1,
    lastUpdated: data.version?.when || '',
    lastUpdatedBy: data.version?.by?.displayName || '',
    labels: (data.metadata?.labels?.results || []).map(l => l.name),
    url: `${INFOHUB_BASE}/pages/viewpage.action?pageId=${data.id}`,
    childPages: (data.children?.page?.results || []).map(c => ({
      id: c.id,
      title: c.title,
    })),
  };
}

// Import pages into Knowledge Base (Qdrant)
async function importPages(token, pages, addedBy) {
  const results = { imported: 0, skipped: 0, errors: [] };

  for (const page of pages) {
    try {
      // Skip very short or empty pages
      if (!page.body || page.body.length < 50) {
        results.skipped++;
        continue;
      }

      // Truncate very long content to avoid embedding issues
      const content = page.body.length > 8000 ? page.body.substring(0, 8000) + '\n\n[Content truncated — view full page on InfoHub]' : page.body;

      await addKBArticle({
        title: page.title,
        content,
        category: page.spaceName || page.spaceKey || 'InfoHub',
        source: page.url,
        addedBy: addedBy || 'InfoHub Sync',
      });

      results.imported++;
    } catch (err) {
      results.errors.push({ title: page.title, error: err.message });
    }
  }

  return results;
}

// Sync an entire space into KB
async function syncSpace(token, spaceKey, addedBy) {
  const pages = await fetchSpacePages(token, spaceKey, 100);
  return importPages(token, pages, addedBy);
}

// Test connection with token
async function testConnection(token) {
  try {
    const data = await confluenceRequest('/rest/api/user/current', token);
    return {
      success: true,
      user: data.displayName || data.username,
      email: data.email || '',
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  testConnection,
  fetchSpaces,
  fetchSpacePages,
  searchInfoHub,
  fetchPage,
  importPages,
  syncSpace,
  extractKeywords,
  extractRelevantContent,
};
