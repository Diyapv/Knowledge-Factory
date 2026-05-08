const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeReusability, aiSuggestImprovements, detectDuplicate, generateTags, explainCode, ebChat, ebChatStream, checkMISRACompliance } = require('./services/ai');
const {
  ensureCollection, upsertAsset, searchAssets,
  getAllAssets, getAssetById, deleteAsset, updateAsset, getStats,
  logActivity, getActivityLog,
  addComment, getCommentsByAsset, deleteComment,
  toggleFavorite, getUserFavorites,
  rateAsset, getAssetRatings,
  findSimilarAssets,
  addKBArticle, getAllKBArticles, deleteKBArticle, searchKBArticles,
  addNote, getUserNotes, updateNote, deleteNote,
} = require('./services/qdrant');
const { validateAzureToken } = require('./middleware/auth');
const infohub = require('./services/infohub');
const { extractText, isSupportedFile, MAX_FILE_SIZE } = require('./services/fileParser');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'snapshots', 'tmp', 'upload');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer config: store files on disk for PDF preview, limit 10MB
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (isSupportedFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}`));
    }
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Apply Azure AD token validation to all routes (passthrough if no token)
app.use(validateAzureToken);

// Server-side InfoHub token storage (persists across requests)
let infohubToken = process.env.INFOHUB_TOKEN || '';

// ── Health ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'qdrant', ollamaUrl: 'http://localhost:11434' });
});

// ── AI Status ───────────────────────────────────────────
app.get('/api/ai/status', async (req, res) => {
  try {
    const [ollamaRes, qdrantRes] = await Promise.all([
      fetch('http://localhost:11434/api/tags').then(r => r.json()),
      fetch('http://localhost:6333/healthz').then(r => r.text()),
    ]);
    res.json({
      connected: true,
      models: ollamaRes.models,
      qdrant: qdrantRes.includes('passed') ? 'connected' : 'error',
    });
  } catch {
    res.json({ connected: false, models: [], qdrant: 'disconnected' });
  }
});

// ── AI Analyze ──────────────────────────────────────────
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { code, description, type, language } = req.body;
    if (!code && !description) {
      return res.status(400).json({ error: 'Code or description is required' });
    }
    const result = await analyzeReusability({ code, description, type, language });
    res.json(result);
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

// ── AI Search (vector similarity) ───────────────────────
app.post('/api/ai/search', async (req, res) => {
  try {
    const { query, type, category, level, limit } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    const results = await searchAssets(query, { type, category, level, limit });
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'AI search failed', details: err.message });
  }
});

// ── AI Suggest ──────────────────────────────────────────
app.post('/api/ai/suggest', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const suggestions = await aiSuggestImprovements(code, language);
    res.json(suggestions);
  } catch (err) {
    console.error('Suggestion error:', err.message);
    res.status(500).json({ error: 'AI suggestion failed', details: err.message });
  }
});

// ── AI Duplicate Detection ──────────────────────────────
app.post('/api/ai/check-duplicate', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const existing = await getAllAssets();
    const result = await detectDuplicate({ name, desc: description }, existing);
    res.json(result);
  } catch (err) {
    console.error('Duplicate check error:', err.message);
    res.json({ isDuplicate: false, similarity: 0 });
  }
});

// ── AI Auto-Tag ─────────────────────────────────────────
app.post('/api/ai/tags', async (req, res) => {
  try {
    const { content, type, language } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const tags = await generateTags(content, type, language);
    res.json({ tags });
  } catch (err) {
    console.error('Tag generation error:', err.message);
    res.json({ tags: [] });
  }
});

// ── AI Explain Code ─────────────────────────────────────
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const explanation = await explainCode(code, language);
    res.json(explanation);
  } catch (err) {
    console.error('Explain error:', err.message);
    res.status(500).json({ error: 'Explanation failed', details: err.message });
  }
});

// ── AI MISRA & Safety Compliance Check ──────────────────
app.post('/api/ai/misra', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const result = await checkMISRACompliance(code, language);
    res.json(result);
  } catch (err) {
    console.error('MISRA check error:', err.message);
    res.status(500).json({ error: 'MISRA compliance check failed', details: err.message });
  }
});

// ── Assets CRUD ─────────────────────────────────────────
app.post('/api/assets', async (req, res) => {
  try {
    const id = Date.now().toString();
    const asset = { id, ...req.body, createdAt: new Date().toISOString() };
    await upsertAsset(asset);
    await logActivity({ action: 'upload', assetId: id, assetName: asset.name, user: asset.submittedBy || asset.author, details: `Uploaded ${asset.type}: ${asset.name}` });
    res.status(201).json(asset);
  } catch (err) {
    console.error('Create error:', err.message);
    res.status(500).json({ error: 'Failed to create asset', details: err.message });
  }
});

// ── File upload endpoint (extracts text server-side for PDFs and binary files) ──
app.post('/api/assets/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileBuffer = fs.readFileSync(req.file.path);
    const text = await extractText(fileBuffer, req.file.originalname);
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    const id = Date.now().toString();
    const asset = {
      id,
      ...metadata,
      code: text,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      createdAt: new Date().toISOString(),
    };
    await upsertAsset(asset);
    await logActivity({ action: 'upload', assetId: id, assetName: asset.name || req.file.originalname, user: asset.submittedBy || asset.author || '', details: `Uploaded ${asset.type || 'File'}: ${asset.name || req.file.originalname}` });
    res.status(201).json(asset);
  } catch (err) {
    console.error('File upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload file', details: err.message });
  }
});

app.get('/api/assets', async (req, res) => {
  try {
    const { type, category, level, status } = req.query;
    const assets = await getAllAssets({ type, category, level, status });
    res.json(assets);
  } catch (err) {
    console.error('List error:', err.message);
    res.status(500).json({ error: 'Failed to list assets', details: err.message });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const asset = await getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Not found' });
    res.json(asset);
  } catch (err) {
    console.error('Get error:', err.message);
    res.status(500).json({ error: 'Failed to get asset', details: err.message });
  }
});

// ── Serve original uploaded file (PDF preview, download) ──
app.get('/api/assets/:id/file', async (req, res) => {
  try {
    const asset = await getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Not found' });
    if (!asset.storedFileName) return res.status(404).json({ error: 'No file stored for this asset' });

    const filePath = path.join(UPLOADS_DIR, asset.storedFileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    const ext = path.extname(asset.originalFileName || '').toLowerCase();
    const mimeTypes = { '.pdf': 'application/pdf', '.txt': 'text/plain', '.js': 'text/javascript', '.py': 'text/x-python', '.ts': 'text/typescript', '.json': 'application/json' };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.originalFileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('File serve error:', err.message);
    res.status(500).json({ error: 'Failed to serve file', details: err.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const updated = await updateAsset(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    // Log status changes
    if (req.body.status) {
      const actionMap = { 'Approved': 'approve', 'Rejected': 'reject' };
      const action = actionMap[req.body.status] || 'update';
      await logActivity({ action, assetId: req.params.id, assetName: updated.name, user: req.body.reviewedBy || '', details: `${req.body.status}: ${updated.name}` });
    }
    res.json(updated);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Failed to update asset', details: err.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    const asset = await getAssetById(req.params.id);
    await deleteAsset(req.params.id);
    if (asset) {
      await logActivity({ action: 'delete', assetId: req.params.id, assetName: asset.name, user: req.query.user || '', details: `Deleted: ${asset.name}` });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete asset', details: err.message });
  }
});

// ── Stats ───────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Failed to get stats', details: err.message });
  }
});

// ── Metadata (languages, categories, types) ─────────────
app.get('/api/metadata', async (req, res) => {
  try {
    const all = await getAllAssets();
    const languages = [...new Set(all.map(a => a.lang).filter(Boolean))].sort();
    const categories = [...new Set(all.map(a => a.category).filter(Boolean))].sort();
    const types = [...new Set(all.map(a => a.type).filter(Boolean))].sort();
    const authors = [...new Set(all.map(a => a.author).filter(Boolean))].sort();
    res.json({ languages, categories, types, authors });
  } catch (err) {
    console.error('Metadata error:', err.message);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// ── Notifications (recent activity) ─────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    const all = await getAllAssets();
    const sorted = all
      .filter(a => a.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const notifications = sorted.map(a => {
      const diff = Date.now() - new Date(a.createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      let time;
      if (mins < 60) time = `${mins}m ago`;
      else if (mins < 1440) time = `${Math.floor(mins / 60)}h ago`;
      else time = `${Math.floor(mins / 1440)}d ago`;

      let text;
      if (a.status === 'Approved') text = `"${a.name}" was approved`;
      else if (a.status === 'Under Review') text = `"${a.name}" submitted for review`;
      else if (a.status === 'Draft') text = `"${a.name}" saved as draft`;
      else if (a.status === 'Rejected') text = `"${a.name}" was rejected`;
      else text = `"${a.name}" added by ${a.author}`;

      return { text, time, unread: mins < 60, asset: a.name, status: a.status };
    });
    res.json(notifications);
  } catch (err) {
    console.error('Notifications error:', err.message);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// ── Search suggestions (top assets) ─────────────────────
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const all = await getAllAssets({ status: 'Approved' });
    const suggestions = all
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 5)
      .map(a => ({ label: a.name, type: a.type, path: `/asset/${a.id}` }));
    // Add static navigation pages
    suggestions.push({ label: 'Browse All Assets', type: 'Page', path: '/browse' });
    suggestions.push({ label: 'Upload New Asset', type: 'Page', path: '/upload' });
    res.json(suggestions);
  } catch (err) {
    console.error('Suggestions error:', err.message);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// ── Activity Log ─────────────────────────────────────────
app.get('/api/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const log = await getActivityLog(limit);
    res.json(log);
  } catch (err) {
    console.error('Activity error:', err.message);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
});

// ── Comments ─────────────────────────────────────────────
app.get('/api/assets/:id/comments', async (req, res) => {
  try {
    const comments = await getCommentsByAsset(req.params.id);
    res.json(comments);
  } catch (err) {
    console.error('Comments error:', err.message);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

app.post('/api/assets/:id/comments', async (req, res) => {
  try {
    const { user, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });
    const comment = await addComment({ assetId: req.params.id, user, text: text.trim() });
    const asset = await getAssetById(req.params.id);
    await logActivity({ action: 'comment', assetId: req.params.id, assetName: asset?.name || '', user, details: text.trim().substring(0, 100) });
    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    await deleteComment(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete comment error:', err.message);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ── Favorites ────────────────────────────────────────────
app.post('/api/assets/:id/favorite', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: 'User is required' });
    const result = await toggleFavorite(req.params.id, user);
    if (!result) return res.status(404).json({ error: 'Asset not found' });
    const asset = await getAssetById(req.params.id);
    await logActivity({ action: 'favorite', assetId: req.params.id, assetName: asset?.name || '', user, details: result.favorited ? 'Added to favorites' : 'Removed from favorites' });
    res.json(result);
  } catch (err) {
    console.error('Favorite error:', err.message);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

app.get('/api/favorites/:username', async (req, res) => {
  try {
    const favorites = await getUserFavorites(req.params.username);
    res.json(favorites);
  } catch (err) {
    console.error('Get favorites error:', err.message);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// ── Ratings ──────────────────────────────────────────────
app.post('/api/assets/:id/rate', async (req, res) => {
  try {
    const { user, rating } = req.body;
    if (!user || !rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'User and rating (1-5) required' });
    const result = await rateAsset(req.params.id, user, rating);
    if (!result) return res.status(404).json({ error: 'Asset not found' });
    const asset = await getAssetById(req.params.id);
    await logActivity({ action: 'rate', assetId: req.params.id, assetName: asset?.name || '', user, details: `Rated ${rating}/5` });
    res.json(result);
  } catch (err) {
    console.error('Rating error:', err.message);
    res.status(500).json({ error: 'Failed to rate asset' });
  }
});

app.get('/api/assets/:id/ratings', async (req, res) => {
  try {
    const ratings = await getAssetRatings(req.params.id);
    res.json(ratings);
  } catch (err) {
    console.error('Get ratings error:', err.message);
    res.status(500).json({ error: 'Failed to get ratings' });
  }
});

// ── Similar Assets (duplicate detection) ─────────────────
app.post('/api/assets/similar', async (req, res) => {
  try {
    const { name, description, threshold } = req.body;
    if (!name && !description) return res.status(400).json({ error: 'Name or description required' });
    const text = [name, description].filter(Boolean).join(' | ');
    const similar = await findSimilarAssets(text, threshold || 0.7, 5);
    res.json(similar);
  } catch (err) {
    console.error('Similar assets error:', err.message);
    res.json([]);
  }
});

// ── InfoHub Token Management ─────────────────────────────
app.post('/api/infohub/connect', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const result = await infohub.testConnection(token);
    if (result.success) {
      infohubToken = token;
      console.log(`InfoHub connected as ${result.user}`);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/infohub/status', (req, res) => {
  res.json({ connected: !!infohubToken });
});

app.post('/api/infohub/disconnect', (req, res) => {
  infohubToken = '';
  res.json({ success: true });
});

// ── EB Knowledge Chatbot ─────────────────────────────────
app.post('/api/chat/eb', async (req, res) => {
  try {
    const { message, history, stream: useStream } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
    const query = message.trim();
    const t0 = Date.now();

    // 1. Search KB + InfoHub IN PARALLEL for speed
    let kbContext = '';
    let infohubContext = '';

    const kbPromise = searchKBArticles(query, 5).catch(e => {
      console.error('KB search error:', e.message);
      return [];
    });

    const hubPromise = infohubToken
      ? infohub.searchInfoHub(infohubToken, query, 10).catch(e => {
          console.error('InfoHub live search error:', e.message);
          return [];
        })
      : Promise.resolve([]);

    const [kbResults, hubResults] = await Promise.all([kbPromise, hubPromise]);
    const tSearch = Date.now();

    // Build KB context
    if (kbResults.length > 0) {
      kbContext = kbResults.slice(0, 2).map(r => `[KB: ${r.title}]\n${r.content.substring(0, 800)}`).join('\n---\n');
    }

    // Build InfoHub context — tight, focused
    if (hubResults.length > 0) {
      const keywords = infohub.extractKeywords(query);
      const top = hubResults
        .filter(r => r.body && r.body.length > 50)
        .slice(0, 3);

      // Fetch full page for #1 result if it scored high
      if (top.length > 0 && top[0].relevanceScore > 50) {
        try {
          const fullPage = await infohub.fetchPage(infohubToken, top[0].id);
          if (fullPage.body && fullPage.body.length > top[0].body.length) {
            top[0].body = fullPage.body;
          }
        } catch (e) { /* use search body */ }
      }

      infohubContext = top.map((r, i) => {
        const maxLen = i === 0 ? 2000 : 800;
        const content = infohub.extractRelevantContent(r.body, keywords, maxLen);
        return `[${r.title}] (URL: ${r.url})\n${content}`;
      }).join('\n---\n');
    }

    const tContext = Date.now();

    // Combine contexts
    let fullContext = '';
    if (kbContext) fullContext += kbContext;
    if (infohubContext) {
      if (fullContext) fullContext += '\n---\n';
      fullContext += infohubContext;
    }

    console.log(`[Chat] search=${tSearch - t0}ms context=${tContext - tSearch}ms | ctx=${fullContext.length} chars`);

    // ── STREAMING MODE ──
    if (useStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send sources first
      res.write(`data: ${JSON.stringify({ type: 'sources', kb: !!kbContext, infohub: !!infohubContext })}\n\n`);

      const ollamaStream = await ebChatStream(query, history || [], fullContext);
      const reader = ollamaStream.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Ollama streams NDJSON — each line is a JSON object
          for (const line of chunk.split('\n').filter(l => l.trim())) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                fullReply += json.message.content;
                res.write(`data: ${JSON.stringify({ type: 'token', content: json.message.content })}\n\n`);
              }
            } catch {}
          }
        }
      } catch (e) {
        console.error('Stream error:', e.message);
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      console.log(`[Chat] llm=${Date.now() - tContext}ms total=${Date.now() - t0}ms (streamed)`);
      return;
    }

    // ── NON-STREAMING MODE ──
    const reply = await ebChat(query, history || [], fullContext);
    const tTotal = Date.now();
    console.log(`[Chat] llm=${tTotal - tContext}ms total=${tTotal - t0}ms | ctx=${fullContext.length} chars`);
    res.json({ reply, sources: { kb: !!kbContext, infohub: !!infohubContext } });
  } catch (err) {
    console.error('EB Chat error:', err.message);
    res.status(500).json({ error: 'Chat failed', details: err.message });
  }
});

// ── Knowledge Base Articles CRUD ───────────────────────
app.get('/api/kb', async (req, res) => {
  try {
    const articles = await getAllKBArticles();
    res.json(articles);
  } catch (err) {
    console.error('KB list error:', err.message);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

app.post('/api/kb', async (req, res) => {
  try {
    const { title, content, category, source, addedBy } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
    const article = await addKBArticle({ title, content, category, source, addedBy });
    res.status(201).json(article);
  } catch (err) {
    console.error('KB add error:', err.message);
    res.status(500).json({ error: 'Failed to add article', details: err.message });
  }
});

app.delete('/api/kb/:id', async (req, res) => {
  try {
    await deleteKBArticle(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('KB delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Upload file(s) to KB — extracts text and creates KB articles
app.post('/api/kb/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { category, addedBy } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const results = [];
    for (const file of req.files) {
      try {
        const text = await extractText(file.buffer, file.originalname);
        if (!text || text.trim().length < 10) {
          results.push({ filename: file.originalname, success: false, error: 'No extractable text content' });
          continue;
        }
        const title = file.originalname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const article = await addKBArticle({
          title,
          content: text.trim(),
          category: category || 'General',
          source: `File upload: ${file.originalname}`,
          addedBy: addedBy || '',
        });
        results.push({ filename: file.originalname, success: true, articleId: article.id, title: article.title, contentLength: text.trim().length });
      } catch (fileErr) {
        console.error(`File parse error for ${file.originalname}:`, fileErr.message);
        results.push({ filename: file.originalname, success: false, error: fileErr.message });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    res.json({ results, summary: { total: results.length, succeeded, failed } });
  } catch (err) {
    console.error('KB file upload error:', err.message);
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
});

// ── InfoHub (Confluence) Integration ───────────────────
app.post('/api/infohub/test', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const result = await infohub.testConnection(token);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/infohub/spaces', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const spaces = await infohub.fetchSpaces(token);
    res.json(spaces);
  } catch (err) {
    console.error('Infohub spaces error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/infohub/pages', async (req, res) => {
  try {
    const { token, spaceKey, limit } = req.body;
    if (!token || !spaceKey) return res.status(400).json({ error: 'Token and spaceKey required' });
    const pages = await infohub.fetchSpacePages(token, spaceKey, limit || 50);
    res.json(pages);
  } catch (err) {
    console.error('Infohub pages error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/infohub/search', async (req, res) => {
  try {
    const { token, query, limit } = req.body;
    if (!token || !query) return res.status(400).json({ error: 'Token and query required' });
    const results = await infohub.searchInfoHub(token, query, limit || 25);
    res.json(results);
  } catch (err) {
    console.error('Infohub search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/infohub/import', async (req, res) => {
  try {
    const { token, pages, addedBy } = req.body;
    if (!token || !pages?.length) return res.status(400).json({ error: 'Token and pages required' });
    const result = await infohub.importPages(token, pages, addedBy);
    res.json(result);
  } catch (err) {
    console.error('Infohub import error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/infohub/sync-space', async (req, res) => {
  try {
    const { token, spaceKey, addedBy } = req.body;
    if (!token || !spaceKey) return res.status(400).json({ error: 'Token and spaceKey required' });
    const result = await infohub.syncSpace(token, spaceKey, addedBy);
    res.json(result);
  } catch (err) {
    console.error('Infohub sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Seed data ───────────────────────────────────────────
async function seedData() {
  // No hardcoded seed data — all assets come from user uploads
}

// ── Personal Notes ──────────────────────────────────────
app.get('/api/notes', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const notes = await getUserNotes(username);
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { username, title, content, color } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    if (!title && !content) return res.status(400).json({ error: 'title or content is required' });
    const note = await addNote(username, { title, content, color });
    res.json(note);
  } catch (err) {
    console.error('Add note error:', err.message);
    res.status(500).json({ error: 'Failed to add note', details: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { username, title, content, color } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const note = await updateNote(req.params.id, username, { title, content, color });
    res.json(note);
  } catch (err) {
    console.error('Update note error:', err.message);
    const status = err.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    await deleteNote(req.params.id, username);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete note error:', err.message);
    const status = err.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ── Start ───────────────────────────────────────────────
const PORT = 3001;

async function start() {
  await ensureCollection();
  await seedData();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knowledge Factory API running on http://0.0.0.0:${PORT}`);
    console.log('Qdrant: http://localhost:6333');
    console.log('Ollama: http://localhost:11434');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
