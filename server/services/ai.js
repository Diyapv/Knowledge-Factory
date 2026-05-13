// Allow self-signed certificates for VIO internal API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const VIO_BASE_URL = 'https://vio.automotive-wan.com:446';
const VIO_API_KEY = 'R0f_Yvf6sqLio8YsqqLqQAAu4yyG8llroNKVylAT4yo';
const CODE_MODEL = 'VIO:GPT-5.3-Codex';   // Optimized for code analysis
const DOC_MODEL  = 'VIO:Claude 4.6 Sonnet'; // Optimized for document analysis
const DEFAULT_MODEL = DOC_MODEL;             // Default for general/chat tasks

// ── Core VIO API call (chat completions) ───────────────
async function callOllama(prompt, options = {}) {
  const response = await fetch(`${VIO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VIO_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 512,
      stream: false,
    }),
  });
  if (!response.ok) throw new Error(`VIO API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// ── VIO chat API (role-based, for conversations) ──
async function callOllamaChat(messages, options = {}) {
  const response = await fetch(`${VIO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VIO_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 512,
      stream: false,
    }),
  });
  if (!response.ok) throw new Error(`VIO API chat error: ${response.status}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ── Streaming VIO chat (returns readable stream) ──
async function callOllamaChatStream(messages, options = {}) {
  const response = await fetch(`${VIO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VIO_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 512,
      stream: true,
    }),
  });
  if (!response.ok) throw new Error(`VIO API chat stream error: ${response.status}`);
  return response.body;
}

// ── JSON parser (handles messy LLM output) ──────────────
function parseJSON(text) {
  // Try direct parse first
  try { return JSON.parse(text.trim()); } catch {}
  // Extract JSON block from surrounding text
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    // Fix common LLM JSON errors: trailing commas, single quotes
    try {
      const fixed = match[0]
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {}
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// OCR TEXT CLEANUP (AI-powered)
// Called when: Extracted text from scanned PDF/image has OCR artifacts
// Purpose: Reconstruct clean text from garbled OCR output
// ══════════════════════════════════════════════════════════
async function cleanExtractedText(rawText) {
  if (!rawText || rawText.length < 50) return rawText;

  // Heuristic: detect if text looks garbled (high ratio of non-dictionary patterns)
  const garbleIndicators = [
    /[bcdfghjklmnpqrstvwxyz]{5,}/gi,  // consecutive consonants
    /[a-z]{20,}/gi,                     // very long words without spaces
    /[£€¢¥]\d/g,                        // OCR symbol confusion like (£8) for (EB)
    /\b[a-z]{1,2}\b/g,                  // many tiny fragments
  ];
  let garbleScore = 0;
  for (const pattern of garbleIndicators) {
    const matches = rawText.match(pattern);
    if (matches) garbleScore += matches.length;
  }

  // If text seems clean enough (low garble score relative to length), skip AI cleanup
  const garbleRatio = garbleScore / (rawText.length / 100);
  if (garbleRatio < 2) return rawText;

  console.log(`[AI Cleanup] Garble ratio: ${garbleRatio.toFixed(1)}, cleaning ${rawText.length} chars...`);

  const prompt = `You are an OCR text correction expert. The following text was extracted from a scanned PDF using OCR and contains errors: garbled words, broken formatting, symbol misrecognition (e.g. "£8" should be "EB"), merged words, and artifacts from logos/images.

Your task: Reconstruct the ORIGINAL document text as accurately as possible.

Rules:
- Fix obvious OCR errors (garbled words, wrong symbols, merged text)
- Preserve the document's original structure (headings, lists, sections)
- Remove pure noise lines (random characters from images/logos)
- Do NOT add content that wasn't in the original
- Do NOT summarize — reproduce the full corrected text
- Keep it factual and faithful to the source

OCR TEXT:
${rawText.substring(0, 3000)}

CORRECTED TEXT:`;

  try {
    const cleaned = await callOllama(prompt, { temperature: 0.1, maxTokens: 2048 });
    // Sanity check: cleaned text should be at least 30% of original length
    if (cleaned && cleaned.length > rawText.length * 0.3) {
      console.log(`[AI Cleanup] Cleaned: ${rawText.length} → ${cleaned.length} chars`);
      return cleaned.trim();
    }
  } catch (err) {
    console.warn('[AI Cleanup] Failed, using raw text:', err.message);
  }
  return rawText;
}

// ══════════════════════════════════════════════════════════
// PROMPT 1: REUSABILITY ANALYSIS
// Called when: User uploads code/doc → Step 4 (AI Analysis)
// Purpose: Score the asset 0-100 and decide if it's reusable
// ══════════════════════════════════════════════════════════
async function analyzeReusability({ code, description, type, language }) {
  const content = code || description || '';
  const assetType = type || 'Code';
  const lang = language || 'unknown';
  const isDocument = assetType.toLowerCase() === 'document';

  let prompt;
  if (isDocument) {
    prompt = `You are a senior technical writer and knowledge management expert. Analyze this document and rate its quality and reusability for a shared knowledge base.

IMPORTANT: This text may have been extracted from a scanned PDF via OCR. Minor OCR artifacts (typos, formatting glitches) should NOT heavily penalize the document. Focus on the ACTUAL CONTENT quality, structure, and usefulness — not OCR extraction quality.

DOCUMENT CONTENT:
${content.substring(0, 1500)}

Evaluate each dimension independently on a 0-100 scale:
1. Clarity: Is the writing clear, concise, and easy to understand? Is it well-structured with headings and sections?
2. Completeness: Does it cover the topic thoroughly? Are there gaps in information?
3. Accuracy: Is the information correct, up-to-date, and well-referenced?
4. Relevance: Is the content useful and applicable to the target audience?
5. Reusability: Can this document be used across teams/projects? Is it generic enough to be widely applicable?

The overall score is the weighted average: clarity(25%) + completeness(20%) + accuracy(20%) + relevance(15%) + reusability(20%).

Respond with ONLY valid JSON, no other text:
{"reusabilityLevel":N,"levelLabel":"label","score":N,"summary":"one line assessment","strengths":["strength1","strength2"],"weaknesses":["weakness1","weakness2"],"suggestions":["suggestion1","suggestion2"],"metrics":{"clarity":N,"completeness":N,"accuracy":N,"relevance":N,"reusability":N}}

Levels: 1=Production-Ready(score 80-100), 2=Verified(60-79), 3=Reference(40-59), 4=Deprecated(0-39)
JSON:`;
  } else {
    prompt = `You are a senior code reviewer. Analyze this ${assetType} written in ${lang} and rate its reusability for a shared knowledge base.

CODE/CONTENT:
${content.substring(0, 1500)}

Evaluate each dimension independently on a 0-100 scale:
1. Modularity: Is it self-contained? Single responsibility? Easy to import?
2. Documentation: Are there comments, docstrings, or clear naming?
3. Testability: Can it be unit tested easily? Are dependencies injectable?
4. Portability: Can it work in different projects without modification?
5. Maintainability: Is the code clean, readable, following best practices?

The overall score is the weighted average: modularity(25%) + documentation(20%) + testability(20%) + portability(15%) + maintainability(20%).

Respond with ONLY valid JSON, no other text:
{"reusabilityLevel":N,"levelLabel":"label","score":N,"summary":"one line assessment","strengths":["strength1","strength2"],"weaknesses":["weakness1","weakness2"],"suggestions":["suggestion1","suggestion2"],"metrics":{"modularity":N,"documentation":N,"testability":N,"portability":N,"maintainability":N}}

Levels: 1=Production-Ready(score 80-100), 2=Verified(60-79), 3=Reference(40-59), 4=Deprecated(0-39)
JSON:`;
  }

  const modelToUse = isDocument ? DOC_MODEL : CODE_MODEL;
  const response = await callOllama(prompt, { temperature: 0.5, maxTokens: 500, model: modelToUse });
  const parsed = parseJSON(response);

  if (parsed) {
    // Clamp overall score to 0-100 integer
    const rawScore = parseInt(parsed.score);
    parsed.score = Math.min(100, Math.max(0, Math.round(isNaN(rawScore) ? 50 : rawScore)));
    // Clamp all metric sub-scores to 0-100 integers
    if (parsed.metrics && typeof parsed.metrics === 'object') {
      const metricKeys = isDocument
        ? ['clarity', 'completeness', 'accuracy', 'relevance', 'reusability']
        : ['modularity', 'documentation', 'testability', 'portability', 'maintainability'];
      for (const key of metricKeys) {
        if (key in parsed.metrics) {
          const raw = parseInt(parsed.metrics[key]);
          parsed.metrics[key] = Math.min(100, Math.max(0, Math.round(isNaN(raw) ? 50 : raw)));
        }
      }
    }
    const rawLevel = parseInt(parsed.reusabilityLevel);
    parsed.reusabilityLevel = Math.min(4, Math.max(1, isNaN(rawLevel) ? 3 : rawLevel));
    // Auto-assign level based on score if model got it wrong
    if (parsed.score >= 80) parsed.reusabilityLevel = 1;
    else if (parsed.score >= 60) parsed.reusabilityLevel = 2;
    else if (parsed.score >= 40) parsed.reusabilityLevel = 3;
    else parsed.reusabilityLevel = 4;
    parsed.levelLabel = ['', 'Production-Ready', 'Verified', 'Reference', 'Deprecated'][parsed.reusabilityLevel];
    // Ensure arrays
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    parsed.weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
    parsed.suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    return parsed;
  }

  // Fallback: basic heuristic scoring if LLM fails
  const score = computeFallbackScore(content, assetType);
  const level = score >= 80 ? 1 : score >= 60 ? 2 : score >= 40 ? 3 : 4;
  const fallbackMetrics = isDocument
    ? { clarity: score, completeness: Math.max(score - 20, 20), accuracy: Math.max(score - 10, 20), relevance: score, reusability: score }
    : { modularity: score, documentation: Math.max(score - 20, 20), testability: Math.max(score - 10, 20), portability: score, maintainability: score };
  return {
    reusabilityLevel: level,
    levelLabel: ['', 'Production-Ready', 'Verified', 'Reference', 'Deprecated'][level],
    score,
    summary: 'Automated heuristic analysis (AI response could not be parsed).',
    strengths: ['Content submitted for review'],
    weaknesses: ['Requires manual assessment'],
    suggestions: isDocument
      ? ['Improve document structure', 'Add references and sources', 'Include examples or diagrams']
      : ['Add documentation', 'Add error handling', 'Remove hardcoded values'],
    metrics: fallbackMetrics,
  };
}

// ══════════════════════════════════════════════════════════
// PROMPT 2: SEMANTIC SEARCH RANKING
// Called when: User uses AI Search toggle on Browse page
// Purpose: Rank existing assets by relevance to a natural language query
// ══════════════════════════════════════════════════════════
async function aiSearch(query, assetList) {
  if (!assetList || assetList.length === 0) return [];

  const assets = assetList.slice(0, 15);
  const list = assets.map((a, i) =>
    `${i + 1}. ${a.name} [${a.type}/${a.lang || a.language || ''}] - ${(a.desc || a.description || '').substring(0, 80)}`
  ).join('\n');

  const prompt = `Task: Rank these assets by relevance to the search query.

Query: "${query}"

Assets:
${list}

Return ONLY JSON. Include items with relevance>30, sorted highest first:
{"results":[{"index":1,"relevance":90,"reason":"short reason"}],"interpretation":"what user needs"}
JSON:`;

  const response = await callOllama(prompt, { temperature: 0.1, maxTokens: 300 });
  const parsed = parseJSON(response);

  if (parsed && parsed.results) {
    return parsed.results
      .filter(r => r.index >= 1 && r.index <= assets.length && r.relevance > 30)
      .map(r => ({
        ...assets[r.index - 1],
        relevance: r.relevance,
        reason: r.reason || 'Relevant match',
      }));
  }

  // Fallback: keyword matching
  const q = query.toLowerCase();
  return assets
    .map(a => {
      const text = `${a.name} ${a.desc || ''} ${a.lang || ''} ${a.category || ''}`.toLowerCase();
      const words = q.split(/\s+/);
      let score = 0;
      words.forEach(w => { if (text.includes(w)) score += 30; });
      return { ...a, relevance: Math.min(score, 100), reason: 'Keyword match' };
    })
    .filter(a => a.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
}

// ══════════════════════════════════════════════════════════
// PROMPT 3: IMPROVEMENT SUGGESTIONS
// Called when: User views a Draft asset and wants AI tips to fix it
// Purpose: Give specific, actionable improvement advice
// ══════════════════════════════════════════════════════════
async function aiSuggestImprovements(code, language) {
  const lang = language || '';
  const prompt = `Task: List 3-5 specific improvements to make this ${lang} code more reusable.

${code.substring(0, 1500)}

Focus on: error handling, documentation, hardcoded values, modularity, naming.
Return ONLY JSON:
{"improvements":[{"category":"modularity","suggestion":"specific fix","priority":"high"}],"overallAdvice":"one paragraph summary"}
JSON:`;

  const response = await callOllama(prompt, { temperature: 0.3, maxTokens: 350, model: CODE_MODEL });
  const parsed = parseJSON(response);

  if (parsed && parsed.improvements) return parsed;

  return {
    improvements: [
      { category: 'documentation', suggestion: 'Add function-level comments explaining parameters and return values', priority: 'high' },
      { category: 'error-handling', suggestion: 'Wrap external calls in try-catch with meaningful error messages', priority: 'high' },
      { category: 'modularity', suggestion: 'Extract hardcoded values into configurable parameters', priority: 'medium' },
    ],
    overallAdvice: 'Focus on removing hardcoded values, adding error handling, and documenting the public API to make this reusable across projects.',
  };
}

// ══════════════════════════════════════════════════════════
// PROMPT 4: DUPLICATE DETECTION
// Called when: User uploads — check if similar asset already exists
// Purpose: Prevent duplicate uploads, suggest existing alternatives
// ══════════════════════════════════════════════════════════
async function detectDuplicate(newAsset, existingAssets) {
  if (!existingAssets || existingAssets.length === 0) return { isDuplicate: false };

  const existing = existingAssets.slice(0, 10).map((a, i) =>
    `${i + 1}. ${a.name} [${a.type}] - ${(a.desc || '').substring(0, 60)}`
  ).join('\n');

  const prompt = `Task: Check if the NEW asset is a duplicate of any EXISTING asset.

NEW: "${newAsset.name}" - ${newAsset.desc || newAsset.description || ''}

EXISTING:
${existing}

Return ONLY JSON:
{"isDuplicate":false,"similarIndex":0,"similarity":0,"reason":""}

Rules: isDuplicate=true only if similarity>70. similarIndex=1-based index of most similar existing asset.
JSON:`;

  const response = await callOllama(prompt, { temperature: 0.1, maxTokens: 150 });
  const parsed = parseJSON(response);

  if (parsed) {
    return {
      isDuplicate: parsed.similarity > 70,
      similarTo: parsed.similarIndex ? existingAssets[parsed.similarIndex - 1] : null,
      similarity: parsed.similarity || 0,
      reason: parsed.reason || '',
    };
  }

  return { isDuplicate: false, similarity: 0 };
}

// ══════════════════════════════════════════════════════════
// PROMPT 5: AUTO-TAG GENERATION
// Called when: User uploads — suggest relevant tags automatically
// Purpose: Save user time, ensure consistent tagging
// ══════════════════════════════════════════════════════════
async function generateTags(content, type, language) {
  const prompt = `Task: Generate 3-6 relevant tags for this ${type || 'code'} (${language || ''}).

${content.substring(0, 1000)}

Tags should be lowercase, single words or short hyphenated phrases.
Return ONLY JSON:
{"tags":["tag1","tag2","tag3"]}
JSON:`;

  const response = await callOllama(prompt, { temperature: 0.2, maxTokens: 100 });
  const parsed = parseJSON(response);

  if (parsed && Array.isArray(parsed.tags)) {
    return parsed.tags.slice(0, 6).map(t => t.toLowerCase().trim());
  }

  // Fallback: extract keywords
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w);
}

// ══════════════════════════════════════════════════════════
// PROMPT 6: EXPLAIN CODE
// Called when: User clicks "Explain" on an asset detail page
// Purpose: Plain English explanation for onboarding / understanding
// ══════════════════════════════════════════════════════════
async function explainCode(code, language) {
  const prompt = `Task: Explain this ${language || ''} code in simple terms for a developer who hasn't seen it before.

${code.substring(0, 1500)}

Cover: what it does, how to use it, key functions/classes, any dependencies.
Return ONLY JSON:
{"summary":"one line what it does","explanation":"2-3 paragraph explanation","usage":"how to use it in your project","dependencies":["dep1"]}
JSON:`;

  const response = await callOllama(prompt, { temperature: 0.3, maxTokens: 400, model: CODE_MODEL });
  const parsed = parseJSON(response);

  if (parsed) return parsed;

  return {
    summary: 'Code explanation could not be generated.',
    explanation: 'Please review the code manually.',
    usage: 'Import and call the exported functions.',
    dependencies: [],
  };
}

// ── Fallback heuristic scoring (when LLM fails) ─────────
function computeFallbackScore(content, type) {
  let score = 40; // base
  if (content.length > 200) score += 10;
  if (content.includes('/**') || content.includes('//') || content.includes('#')) score += 10; // has comments
  if (content.includes('try') || content.includes('catch') || content.includes('except')) score += 10; // error handling
  if (content.includes('export') || content.includes('module.exports')) score += 5; // modular
  if (content.includes('test') || content.includes('describe') || content.includes('it(')) score += 10; // tests
  if (/[A-Z_]{3,}/.test(content)) score += 5; // constants (not hardcoded)
  return Math.min(score, 95);
}

// ══════════════════════════════════════════════════════════
// ELEKTROBIT KNOWLEDGE CHATBOT
// ══════════════════════════════════════════════════════════
const EB_KNOWLEDGE = `
You are the Elektrobit (EB) Knowledge Assistant. Answer questions about EB's automotive software products using retrieved articles and this core knowledge:

## EB Products
- **EB tresos**: AUTOSAR Classic BSW configuration tool (industry standard)
- **EB corbos**: Linux-based HPC platform (EB corbos Linux on Ubuntu, AdaptiveCore, Hypervisor)
- **EB GUIDE**: HMI framework for clusters/infotainment (2D/3D, speech)
- **EB Assist**: ADAS solutions (sensor fusion, computer vision)
- **EB cadian**: Connected car, OTA updates, diagnostics
- **EB zoneo**: Zonal controllers, gateway software

## EB Overview
- Global automotive embedded/connected software supplier, subsidiary of Continental AG
- 3,500+ employees, 10+ countries, 5B+ devices running EB software
- Tech: C/C++/Python, AUTOSAR Classic & Adaptive, ISO 26262, ASPICE, MISRA
- Tools: Jenkins, GitLab CI/CD, Jira, Confluence, Docker, Kubernetes

Keep answers concise with bullet points. Cite article titles and include URLs when available.
`;

async function ebChat(message, history = [], kbContext = '') {
  const messages = [];

  if (kbContext) {
    messages.push({ role: 'system', content: 'You are EB Knowledge Assistant. Answer the user\'s question using the reference articles provided. Cite article titles and include URLs. Be specific and accurate.' });

    // Put articles in user message — small models handle this better
    messages.push({ role: 'user', content: `Here are reference articles:\n\n${kbContext}\n\nBased on these articles, answer: ${message}` });
  } else {
    messages.push({ role: 'system', content: EB_KNOWLEDGE });
    const recentHistory = (history || []).slice(-3);
    for (const m of recentHistory) {
      messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
    }
    messages.push({ role: 'user', content: message });
  }

  const response = await callOllamaChat(messages, { temperature: 0.3, maxTokens: 600, numCtx: 4096 });
  return response.trim();
}

// Streaming version of ebChat
async function ebChatStream(message, history = [], kbContext = '') {
  const messages = [];

  if (kbContext) {
    messages.push({ role: 'system', content: 'You are EB Knowledge Assistant. Answer the user\'s question using the reference articles provided. Cite article titles and include URLs. Be specific and accurate.' });
    messages.push({ role: 'user', content: `Here are reference articles:\n\n${kbContext}\n\nBased on these articles, answer: ${message}` });
  } else {
    messages.push({ role: 'system', content: EB_KNOWLEDGE });
    const recentHistory = (history || []).slice(-3);
    for (const m of recentHistory) {
      messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
    }
    messages.push({ role: 'user', content: message });
  }

  return callOllamaChatStream(messages, { temperature: 0.3, maxTokens: 600, numCtx: 4096 });
}

// ══════════════════════════════════════════════════════════
// MISRA & SAFETY COMPLIANCE CHECKER
// ══════════════════════════════════════════════════════════
async function checkMISRACompliance(code, language) {
  const lang = language || 'C';
  const prompt = `You are an automotive safety expert specializing in MISRA C/C++ and ISO 26262. Analyze this ${lang} code for compliance issues.

CODE:
${code.substring(0, 2000)}

Return a JSON object with this exact structure:
{
  "asilLevel": "QM|A|B|C|D",
  "misraScore": 0-100,
  "overallCompliance": "Compliant|Minor Issues|Major Issues|Non-Compliant",
  "violations": [
    {"rule": "MISRA-C:2012 Rule X.Y", "severity": "Required|Advisory|Mandatory", "line": "description of where", "description": "what is wrong", "fix": "how to fix it"}
  ],
  "safetyNotes": ["note about safety implications"],
  "recommendations": ["specific improvement suggestion"]
}

Rules to check:
- No dynamic memory allocation (malloc/free) in safety-critical code
- No recursion
- No goto statements
- All switch cases must have break or return
- All functions must have explicit return types
- No implicit type conversions
- Pointer arithmetic restrictions
- All variables must be initialized before use
- No dead code or unreachable code
- Function complexity (cyclomatic) should be <15
- No use of setjmp/longjmp
- Array bounds must be checked

Return ONLY valid JSON.`;

  const raw = await callOllama(prompt, { temperature: 0.2, maxTokens: 1024, model: CODE_MODEL });
  const result = parseJSON(raw);
  if (result) return result;
  return {
    asilLevel: 'QM',
    misraScore: 50,
    overallCompliance: 'Analysis Incomplete',
    violations: [],
    safetyNotes: ['AI analysis returned incomplete results. Manual review recommended.'],
    recommendations: ['Run static analysis with Coverity or Polyspace for comprehensive MISRA checking.'],
  };
}

module.exports = {
  analyzeReusability,
  aiSearch,
  aiSuggestImprovements,
  detectDuplicate,
  generateTags,
  explainCode,
  ebChat,
  ebChatStream,
  checkMISRACompliance,
  cleanExtractedText,
};
