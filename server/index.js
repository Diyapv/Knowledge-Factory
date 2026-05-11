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
  saveResume, getUserResumes, getResumeById, deleteResume,
  createFeedback, getAllFeedback, addReply, toggleFeedbackLike, deleteFeedback, updateFeedback, deleteReply, toggleReplyLike,
  saveDailyLog, getDailyLog, getUserTaskLogs,
  addDevice, getAllDevices, getDeviceById, updateDevice, deleteDevice,
  createRecognition, getAllRecognitions, toggleRecognitionLike, deleteRecognition,
  createJob, getAllJobs, getJobById, applyToJob, updateJobStatus, updateApplicantStatus, deleteJob,
  addEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee,
  searchEmployeesBySkill,
  getProfile, saveProfile,
  createPoll, getAllPolls, votePoll, deletePoll, closePoll,
  setLeaveStatus, getAllLeaveStatuses, getUserLeaveHistory,
  createAnnouncement, getAllAnnouncements, toggleAnnouncementPin, deleteAnnouncement, updateAnnouncement,
  createBooking, getBookingsForDate, getAllBookings, deleteBooking,
  createQuickLink, getAllQuickLinks, updateQuickLink, deleteQuickLink,
  createStandupPage, getAllStandupPages, getStandupPage, updateStandupPageMembers, deleteStandupPage,
  addStandupEntry, getStandupEntries, updateStandupEntry, deleteStandupEntry,
  addStandupMessage, getStandupMessages, deleteStandupMessage,
  createMeeting, getAllMeetings, getMeeting, updateMeeting, deleteMeeting,
  addActionItem, updateActionItem, deleteActionItem,
  createWish, getWishesForUser, markWishRead,
  createIdea, getAllIdeas, upvoteIdea, setIdeaOfTheMonth, updateIdeaStatus, deleteIdea, addIdeaComment,
  createQuiz, getAllQuizzes, getQuiz, updateQuiz, deleteQuiz, submitQuizAttempt, getQuizLeaderboard,
  createPhoto, getAllPhotos, deletePhoto, togglePhotoReaction, addPhotoComment,
} = require('./services/qdrant');
const { validateAzureToken } = require('./middleware/auth');
const infohub = require('./services/infohub');
const { sendMentionNotification } = require('./services/mailer');
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

// ── Resume Builder ──────────────────────────────────────
app.get('/api/resumes', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const resumes = await getUserResumes(username);
    res.json(resumes);
  } catch (err) {
    console.error('Get resumes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch resumes', details: err.message });
  }
});

app.get('/api/resumes/:id', async (req, res) => {
  try {
    const resume = await getResumeById(req.params.id);
    res.json(resume);
  } catch (err) {
    console.error('Get resume error:', err.message);
    const status = err.message === 'Resume not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/resumes', async (req, res) => {
  try {
    const { username, ...data } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const resume = await saveResume(username, data);
    res.json(resume);
  } catch (err) {
    console.error('Save resume error:', err.message);
    res.status(500).json({ error: 'Failed to save resume', details: err.message });
  }
});

app.delete('/api/resumes/:id', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    await deleteResume(req.params.id, username);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete resume error:', err.message);
    const status = err.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ── Start (actual) ──────────────────────────────────────

// ── Open Feedback ───────────────────────────────────────
app.get('/api/feedback', async (req, res) => {
  try {
    const feedback = await getAllFeedback();
    res.json(feedback);
  } catch (err) {
    console.error('Get feedback error:', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback', details: err.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { username, displayName, title, content, category } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    if (!title && !content) return res.status(400).json({ error: 'title or content is required' });
    const fb = await createFeedback(username, displayName || username, { title, content, category });
    res.json(fb);
  } catch (err) {
    console.error('Create feedback error:', err.message);
    res.status(500).json({ error: 'Failed to create feedback', details: err.message });
  }
});

app.post('/api/feedback/:id/reply', async (req, res) => {
  try {
    const { username, displayName, text } = req.body;
    if (!username || !text) return res.status(400).json({ error: 'username and text are required' });
    const reply = await addReply(req.params.id, username, displayName || username, text);
    res.json(reply);
  } catch (err) {
    console.error('Add reply error:', err.message);
    res.status(500).json({ error: 'Failed to add reply', details: err.message });
  }
});

app.post('/api/feedback/:id/like', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const result = await toggleFeedbackLike(req.params.id, username);
    res.json(result);
  } catch (err) {
    console.error('Like feedback error:', err.message);
    res.status(500).json({ error: 'Failed to toggle like', details: err.message });
  }
});

app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const { username, role } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    await deleteFeedback(req.params.id, username, role);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete feedback error:', err.message);
    const status = err.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/feedback/:id', async (req, res) => {
  try {
    const { username, role } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const updated = await updateFeedback(req.params.id, username, role, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Update feedback error:', err.message);
    const status = err.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/feedback/:id/reply/:replyId', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    await deleteReply(req.params.id, req.params.replyId, username);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete reply error:', err.message);
    const status = err.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/feedback/:id/reply/:replyId/like', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const result = await toggleReplyLike(req.params.id, req.params.replyId, username);
    res.json(result);
  } catch (err) {
    console.error('Like reply error:', err.message);
    res.status(500).json({ error: 'Failed to toggle reply like', details: err.message });
  }
});

// Notify mentioned users via email
app.post('/api/feedback/notify-mentions', async (req, res) => {
  try {
    const { mentionedBy, context, feedbackTitle, messageText } = req.body;
    if (!messageText) return res.json({ sent: 0 });

    // Find all @mentions by checking employee names against the text
    const allEmployees = await getAllEmployees();
    let sent = 0;
    for (const emp of allEmployees) {
      if (!emp.name || !emp.email) continue;
      // Check if @Name appears in the text (case-insensitive)
      const pattern = new RegExp('@' + emp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|$|[.,!?;])', 'i');
      if (pattern.test(messageText)) {
        sendMentionNotification({
          toEmail: emp.email,
          mentionedName: emp.name,
          mentionedBy,
          context: context || 'feedback',
          feedbackTitle: feedbackTitle || '',
          messageText: messageText || '',
        });
        sent++;
      }
    }
    res.json({ sent });
  } catch (err) {
    console.error('Notify mentions error:', err.message);
    res.status(500).json({ error: 'Failed to notify', details: err.message });
  }
});

// ── Start (final) ──────────────────────────────────────

// ── Daily Task Tracker ──────────────────────────────────
app.get('/api/tasks/daily', async (req, res) => {
  try {
    const { username, date } = req.query;
    if (!username || !date) return res.status(400).json({ error: 'username and date are required' });
    const log = await getDailyLog(username, date);
    res.json(log || { tasks: [], updates: '', nextDayPlan: '' });
  } catch (err) {
    console.error('Get daily log error:', err.message);
    res.status(500).json({ error: 'Failed to fetch daily log', details: err.message });
  }
});

app.get('/api/tasks/history', async (req, res) => {
  try {
    const { username, limit } = req.query;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const logs = await getUserTaskLogs(username, Number(limit) || 30);
    res.json(logs);
  } catch (err) {
    console.error('Get task history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history', details: err.message });
  }
});

app.post('/api/tasks/daily', async (req, res) => {
  try {
    const { username, date, tasks, updates, nextDayPlan } = req.body;
    if (!username || !date) return res.status(400).json({ error: 'username and date are required' });
    const log = await saveDailyLog(username, date, { tasks, updates, nextDayPlan });
    res.json(log);
  } catch (err) {
    console.error('Save daily log error:', err.message);
    res.status(500).json({ error: 'Failed to save daily log', details: err.message });
  }
});

// ── Server Start ────────────────────────────────────────

// ── Device Asset Management ──────────────────────────────
app.get('/api/devices', async (req, res) => {
  try {
    const { type, status, assignedTo } = req.query;
    const devices = await getAllDevices({ type, status, assignedTo });
    res.json(devices);
  } catch (err) {
    console.error('Get devices error:', err.message);
    res.status(500).json({ error: 'Failed to fetch devices', details: err.message });
  }
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await getDeviceById(req.params.id);
    res.json(device);
  } catch (err) {
    const status = err.message === 'Device not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const device = await addDevice(req.body);
    res.json(device);
  } catch (err) {
    console.error('Add device error:', err.message);
    res.status(500).json({ error: 'Failed to add device', details: err.message });
  }
});

app.put('/api/devices/:id', async (req, res) => {
  try {
    const device = await updateDevice(req.params.id, req.body);
    res.json(device);
  } catch (err) {
    console.error('Update device error:', err.message);
    const status = err.message === 'Device not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/devices/:id', async (req, res) => {
  try {
    await deleteDevice(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete device error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Recognition System Routes ──────────────────────────────────
app.get('/api/recognitions', async (req, res) => {
  try {
    const list = await getAllRecognitions();
    res.json(list);
  } catch (err) {
    console.error('Get recognitions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recognitions', async (req, res) => {
  try {
    const rec = await createRecognition(req.body);
    res.json(rec);
  } catch (err) {
    console.error('Create recognition error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recognitions/:id/like', async (req, res) => {
  try {
    const rec = await toggleRecognitionLike(req.params.id, req.body.username);
    res.json(rec);
  } catch (err) {
    console.error('Toggle recognition like error:', err.message);
    const status = err.message === 'Recognition not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/recognitions/:id', async (req, res) => {
  try {
    await deleteRecognition(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete recognition error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Internal Job Board Routes ──────────────────────────────
app.get('/api/jobs', async (req, res) => {
  try {
    const list = await getAllJobs();
    res.json(list);
  } catch (err) {
    console.error('Get jobs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    res.json(job);
  } catch (err) {
    const status = err.message === 'Job not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const job = await createJob(req.body);
    res.json(job);
  } catch (err) {
    console.error('Create job error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs/:id/apply', async (req, res) => {
  try {
    const job = await applyToJob(req.params.id, req.body);
    res.json(job);
  } catch (err) {
    const status = err.message === 'Job not found' ? 404 : err.message === 'Already applied' ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/jobs/:id/status', async (req, res) => {
  try {
    const job = await updateJobStatus(req.params.id, req.body.status);
    res.json(job);
  } catch (err) {
    const status = err.message === 'Job not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/jobs/:id/applicant', async (req, res) => {
  try {
    const job = await updateApplicantStatus(req.params.id, req.body.username, req.body.status);
    res.json(job);
  } catch (err) {
    const status = err.message === 'Job not found' || err.message === 'Applicant not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await deleteJob(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete job error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Employee Directory Routes ───────────────────────────
app.get('/api/employees', async (req, res) => {
  try {
    const list = await getAllEmployees();
    res.json(list);
  } catch (err) {
    console.error('Get employees error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Skill search must come before /:id route
app.get('/api/employees/search-skills', async (req, res) => {
  try {
    const { skill, minRating } = req.query;
    if (!skill) return res.status(400).json({ error: 'skill parameter is required' });
    const results = await searchEmployeesBySkill(skill, Number(minRating) || 1);
    res.json(results);
  } catch (err) {
    console.error('Search skills error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const emp = await getEmployeeById(req.params.id);
    res.json(emp);
  } catch (err) {
    const status = err.message === 'Employee not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const emp = await addEmployee(req.body);
    res.json(emp);
  } catch (err) {
    console.error('Add employee error:', err.message);
    const status = err.message.startsWith('Duplicate') ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const emp = await updateEmployee(req.params.id, req.body);
    res.json(emp);
  } catch (err) {
    const status = err.message === 'Employee not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await deleteEmployee(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete employee error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload employees from CSV/TXT file
app.post('/api/employees/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const buffer = fs.readFileSync(req.file.path);
    const text = buffer.toString('utf-8').trim();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ error: 'File must have a header row and at least one data row' });

    // Parse header
    const sep = lines[0].includes('\t') ? '\t' : ',';
    function parseCSVLine(line, delimiter) {
      const fields = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        if (inQuotes) {
          if (line[c] === '"' && line[c + 1] === '"') { current += '"'; c++; }
          else if (line[c] === '"') { inQuotes = false; }
          else { current += line[c]; }
        } else {
          if (line[c] === '"') { inQuotes = true; }
          else if (line[c] === delimiter) { fields.push(current.trim()); current = ''; }
          else { current += line[c]; }
        }
      }
      fields.push(current.trim());
      return fields;
    }
    const headers = parseCSVLine(lines[0], sep).map(h => h.toLowerCase().replace(/\s+/g, ''));

    // Map common header names to our fields
    const fieldMap = {
      employeeid: 'employeeId', empid: 'employeeId', id: 'employeeId',
      name: 'name', fullname: 'name', employeename: 'name',
      email: 'email', emailid: 'email', emailaddress: 'email',
      phone: 'phone', mobile: 'phone', phonenumber: 'phone', contact: 'phone',
      department: 'department', dept: 'department',
      designation: 'designation', title: 'designation', jobtitle: 'designation',
      role: 'role', position: 'role',
      skills: 'skills', skill: 'skills', expertise: 'skills',
      location: 'location', office: 'location', city: 'location',
      joindate: 'joinDate', dateofjoining: 'joinDate', doj: 'joinDate', joiningdate: 'joinDate',
      bio: 'bio', about: 'bio', description: 'bio',
    };

    const colMapping = headers.map(h => fieldMap[h] || null);
    const addedBy = req.body.addedBy || 'admin';
    const results = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const vals = parseCSVLine(lines[i], sep);
        const entry = {};
        colMapping.forEach((field, idx) => {
          if (field && vals[idx]) {
            if (field === 'skills') {
              entry[field] = vals[idx].split(/[;|,]/).map(s => s.trim()).filter(Boolean);
            } else {
              entry[field] = vals[idx];
            }
          }
        });
        if (!entry.name) { errors.push(`Row ${i + 1}: Missing name`); continue; }
        entry.addedBy = addedBy;
        const emp = await addEmployee(entry);
        results.push(emp);
      } catch (rowErr) {
        errors.push(`Row ${i + 1}: ${rowErr.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});
    res.json({ added: results.length, errors, employees: results });
  } catch (err) {
    console.error('Bulk upload employees error:', err.message);
    res.status(500).json({ error: 'Failed to process file', details: err.message });
  }
});

// ── User Profile ──────────────────────────────────
app.get('/api/profile/:username', async (req, res) => {
  try {
    const profile = await getProfile(req.params.username);
    res.json(profile || {});
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile/:username', async (req, res) => {
  try {
    const saved = await saveProfile(req.params.username, req.body);

    // Sync dateOfBirth to employee record if provided
    if (req.body.dateOfBirth) {
      try {
        const employees = await getAllEmployees();
        const email = (req.body.email || '').toLowerCase();
        const emp = employees.find(e =>
          (e.email && e.email.toLowerCase() === email) ||
          (e.name && e.name.toLowerCase() === (req.body.fullName || '').toLowerCase())
        );
        if (emp) await updateEmployee(emp.id, { dateOfBirth: req.body.dateOfBirth });
      } catch (syncErr) { console.error('Sync DOB to employee:', syncErr.message); }
    }

    res.json(saved);
  } catch (err) {
    console.error('Save profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Polls ──────────────────────────────────────────────
app.get('/api/polls', async (req, res) => {
  try { res.json(await getAllPolls()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/polls', async (req, res) => {
  try {
    const { username, displayName, question, options, category, endsAt, allowMultiple } = req.body;
    res.json(await createPoll(username, displayName, { question, options, category, endsAt, allowMultiple }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { username, optionIds } = req.body;
    res.json(await votePoll(req.params.id, username, optionIds));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/polls/:id/close', async (req, res) => {
  try {
    const { username } = req.body;
    res.json(await closePoll(req.params.id, username));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/polls/:id', async (req, res) => {
  try {
    const username = req.query.user;
    const role = req.query.role;
    res.json(await deletePoll(req.params.id, username, role));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Leave / WFH Tracker ────────────────────────────────────
app.get('/api/leave-status', async (req, res) => {
  try {
    const { date } = req.query;
    res.json(await getAllLeaveStatuses(date || null));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leave-status/:username/history', async (req, res) => {
  try {
    res.json(await getUserLeaveHistory(req.params.username));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leave-status', async (req, res) => {
  try {
    const { username, displayName, status, date, note } = req.body;
    res.json(await setLeaveStatus(username, displayName, { status, date, note }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Announcements Board ────────────────────────────────────
app.get('/api/announcements', async (req, res) => {
  try { res.json(await getAllAnnouncements()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { username, displayName, title, content, priority, pinned } = req.body;
    res.json(await createAnnouncement(username, displayName, { title, content, priority, pinned }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/announcements/:id/pin', async (req, res) => {
  try {
    const { username, role } = req.body;
    res.json(await toggleAnnouncementPin(req.params.id, username, role));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const username = req.query.user;
    const role = req.query.role;
    res.json(await deleteAnnouncement(req.params.id, username, role));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/announcements/:id', async (req, res) => {
  try {
    const { username, role, title, content, priority } = req.body;
    res.json(await updateAnnouncement(req.params.id, username, role, { title, content, priority }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Booking System ────────────────────────────────────────
app.get('/api/bookings', async (req, res) => {
  try {
    const { date } = req.query;
    if (date) res.json(await getBookingsForDate(date));
    else res.json(await getAllBookings());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { username, displayName, resource, resourceType, date, startTime, endTime, title, notes } = req.body;
    res.json(await createBooking(username, displayName, { resource, resourceType, date, startTime, endTime, title, notes }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const username = req.query.user;
    res.json(await deleteBooking(req.params.id, username));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Quick Links / Bookmarks ──────────────────────────────
app.get('/api/quicklinks', async (req, res) => {
  try { res.json(await getAllQuickLinks()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/quicklinks', async (req, res) => {
  try {
    const { url, title, description, category, tags, username, displayName } = req.body;
    res.json(await createQuickLink({ url, title, description, category, tags, username, displayName }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/quicklinks/:id', async (req, res) => {
  try { res.json(await updateQuickLink(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/quicklinks/:id', async (req, res) => {
  try { res.json(await deleteQuickLink(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Standup Notes / Daily Scrum ──────────────────────────────
app.get('/api/standups/pages', async (req, res) => {
  try { res.json(await getAllStandupPages()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/standups/pages/:id', async (req, res) => {
  try { res.json(await getStandupPage(req.params.id)); }
  catch (err) { res.status(404).json({ error: err.message }); }
});

app.post('/api/standups/pages', async (req, res) => {
  try { res.json(await createStandupPage(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/standups/pages/:id/members', async (req, res) => {
  try { res.json(await updateStandupPageMembers(req.params.id, req.body.members)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/standups/pages/:id', async (req, res) => {
  try { res.json(await deleteStandupPage(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/standups/pages/:id/entries', async (req, res) => {
  try { res.json(await getStandupEntries(req.params.id, req.query.date)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/standups/pages/:id/entries', async (req, res) => {
  try {
    const data = { ...req.body, pageId: req.params.id };
    res.json(await addStandupEntry(data));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/standups/entries/:id', async (req, res) => {
  try { res.json(await updateStandupEntry(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/standups/entries/:id', async (req, res) => {
  try { res.json(await deleteStandupEntry(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// Standup Messages
app.get('/api/standups/pages/:id/messages', async (req, res) => {
  try { res.json(await getStandupMessages(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/standups/pages/:id/messages', async (req, res) => {
  try {
    const data = { ...req.body, pageId: req.params.id };
    res.json(await addStandupMessage(data));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/standups/messages/:id', async (req, res) => {
  try { res.json(await deleteStandupMessage(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Meeting Minutes ────────────────────────────────────
app.get('/api/meetings', async (req, res) => {
  try { res.json(await getAllMeetings()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/meetings/:id', async (req, res) => {
  try { res.json(await getMeeting(req.params.id)); }
  catch (err) { res.status(404).json({ error: err.message }); }
});

app.post('/api/meetings', async (req, res) => {
  try { res.json(await createMeeting(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/meetings/:id', async (req, res) => {
  try { res.json(await updateMeeting(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try { res.json(await deleteMeeting(req.params.id)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/meetings/:id/actions', async (req, res) => {
  try { res.json(await addActionItem(req.params.id, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/meetings/:meetingId/actions/:actionId', async (req, res) => {
  try { res.json(await updateActionItem(req.params.meetingId, req.params.actionId, req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/meetings/:meetingId/actions/:actionId', async (req, res) => {
  try { res.json(await deleteActionItem(req.params.meetingId, req.params.actionId)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Celebrations (Birthday & Work Anniversary) ─────────
app.get('/api/celebrations', async (req, res) => {
  try {
    const employees = await getAllEmployees();
    const today = new Date();
    const todayMD = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const celebrations = [];
    for (const emp of employees) {
      if (emp.dateOfBirth) {
        const [y, m, d] = emp.dateOfBirth.split('-');
        const md = m + '-' + d;
        const thisYearBday = new Date(today.getFullYear(), Number(m) - 1, Number(d));
        const diff = Math.round((thisYearBday - today) / 86400000);
        celebrations.push({
          type: 'birthday',
          name: emp.name,
          email: emp.email,
          department: emp.department,
          designation: emp.designation,
          date: emp.dateOfBirth,
          monthDay: md,
          daysUntil: diff < 0 ? diff + 365 : diff,
          isToday: md === todayMD,
          age: today.getFullYear() - Number(y),
        });
      }
      if (emp.joinDate && emp.joinDate.includes('-')) {
        const [y, m, d] = emp.joinDate.split('-');
        const md = m + '-' + d;
        const thisYearAnniv = new Date(today.getFullYear(), Number(m) - 1, Number(d));
        const diff = Math.round((thisYearAnniv - today) / 86400000);
        const years = today.getFullYear() - Number(y);
        if (years > 0) {
          celebrations.push({
            type: 'anniversary',
            name: emp.name,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            date: emp.joinDate,
            monthDay: md,
            daysUntil: diff < 0 ? diff + 365 : diff,
            isToday: md === todayMD,
            years,
          });
        }
      }
    }
    res.json(celebrations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Send celebration wish (stored in-app)
app.post('/api/celebrations/send-wishes', async (req, res) => {
  try {
    const { name, email, type, message, senderName, senderUsername } = req.body;
    const wish = await createWish({
      recipientName: name,
      recipientEmail: email,
      type,
      message,
      senderName: senderName || 'Someone',
      senderUsername: senderUsername || '',
    });
    console.log(`[WISH] ${senderName} sent ${type} wish to ${name}`);
    // Send email notification
    const { sendCelebrationWishEmail } = require('./services/mailer');
    sendCelebrationWishEmail({ toEmail: email, recipientName: name, senderName: senderName || 'Someone', type, message });
    res.json({ success: true, wish });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get wishes for a user
app.get('/api/celebrations/wishes/:name', async (req, res) => {
  try { res.json(await getWishesForUser(req.params.name)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark wish as read
app.put('/api/celebrations/wishes/:id/read', async (req, res) => {
  try { res.json(await markWishRead(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Idea Box / Innovation Board Routes ──────────────────
app.get('/api/ideas', async (req, res) => {
  try { res.json(await getAllIdeas()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ideas', async (req, res) => {
  try { res.json(await createIdea(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ideas/:id/upvote', async (req, res) => {
  try { res.json(await upvoteIdea(req.params.id, req.body.username)); }
  catch (err) { res.status(err.message === 'Idea not found' ? 404 : 500).json({ error: err.message }); }
});

app.post('/api/ideas/:id/idea-of-month', async (req, res) => {
  try { res.json(await setIdeaOfTheMonth(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/ideas/:id/status', async (req, res) => {
  try { res.json(await updateIdeaStatus(req.params.id, req.body.status)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ideas/:id/comments', async (req, res) => {
  try { res.json(await addIdeaComment(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/ideas/:id', async (req, res) => {
  try { await deleteIdea(req.params.id); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Trivia / Quiz Arena ──────────────────────────────────
app.post('/api/quizzes', async (req, res) => {
  try { res.json(await createQuiz(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/quizzes', async (req, res) => {
  try { res.json(await getAllQuizzes()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/quizzes/leaderboard', async (req, res) => {
  try { res.json(await getQuizLeaderboard()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try { res.json(await getQuiz(req.params.id)); }
  catch (err) { res.status(err.message === 'Quiz not found' ? 404 : 500).json({ error: err.message }); }
});

app.put('/api/quizzes/:id', async (req, res) => {
  try { res.json(await updateQuiz(req.params.id, req.body)); }
  catch (err) { res.status(err.message === 'Quiz not found' ? 404 : 500).json({ error: err.message }); }
});

app.delete('/api/quizzes/:id', async (req, res) => {
  try { await deleteQuiz(req.params.id); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/quizzes/:id/attempt', async (req, res) => {
  try { res.json(await submitQuizAttempt(req.params.id, req.body)); }
  catch (err) { res.status(err.message === 'Quiz not found' ? 404 : 500).json({ error: err.message }); }
});

// ── Photo Gallery / Wall ────────────────────────────────
app.post('/api/gallery', async (req, res) => {
  try { res.json(await createPhoto(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gallery', async (req, res) => {
  try { res.json(await getAllPhotos()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try { await deletePhoto(req.params.id); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gallery/:id/reaction', async (req, res) => {
  try { res.json(await togglePhotoReaction(req.params.id, req.body)); }
  catch (err) { res.status(err.message === 'Photo not found' ? 404 : 500).json({ error: err.message }); }
});

app.post('/api/gallery/:id/comments', async (req, res) => {
  try { res.json(await addPhotoComment(req.params.id, req.body)); }
  catch (err) { res.status(err.message === 'Photo not found' ? 404 : 500).json({ error: err.message }); }
});

// ── Final Server Start ──────────────────────────────────
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
