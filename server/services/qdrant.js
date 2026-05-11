const { QdrantClient } = require('@qdrant/js-client-rest');

const OLLAMA_EMBED_URL = 'http://localhost:11434/api/embed';
const EMBED_MODEL = 'nomic-embed-text';
const COLLECTION = 'assets';
const ACTIVITY_COLLECTION = 'activity_log';
const COMMENTS_COLLECTION = 'comments';
const KB_COLLECTION = 'kb_articles';
const NOTES_COLLECTION = 'personal_notes';
const RESUMES_COLLECTION = 'resumes';
const FEEDBACK_COLLECTION = 'feedback';
const TASKS_COLLECTION = 'daily_tasks';
const DEVICES_COLLECTION = 'device_assets';
const RECOGNITION_COLLECTION = 'recognitions';
const JOBS_COLLECTION = 'internal_jobs';
const EMPLOYEES_COLLECTION = 'employees';
const PROFILES_COLLECTION = 'user_profiles';
const POLLS_COLLECTION = 'polls';
const LEAVE_STATUS_COLLECTION = 'leave_status';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const BOOKINGS_COLLECTION = 'bookings';
const QUICKLINKS_COLLECTION = 'quicklinks';
const STANDUP_PAGES_COLLECTION = 'standup_pages';
const STANDUP_ENTRIES_COLLECTION = 'standup_entries';
const MEETINGS_COLLECTION = 'meetings';
const STANDUP_MESSAGES_COLLECTION = 'standup_messages';
const WISHES_COLLECTION = 'wishes';
const IDEAS_COLLECTION = 'ideas';
const QUIZZES_COLLECTION = 'quizzes';
const GALLERY_COLLECTION = 'photo_gallery';
const VECTOR_SIZE = 768;

const client = new QdrantClient({ url: 'http://localhost:6333', checkCompatibility: false });

async function ensureCollection() {
  try {
    await client.getCollection(COLLECTION);
  } catch {
    await client.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${COLLECTION}`);
  }
  // Activity log collection (dummy vector, we only use payload)
  try {
    await client.getCollection(ACTIVITY_COLLECTION);
  } catch {
    await client.createCollection(ACTIVITY_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${ACTIVITY_COLLECTION}`);
  }
  // Comments collection (dummy vector, we only use payload)
  try {
    await client.getCollection(COMMENTS_COLLECTION);
  } catch {
    await client.createCollection(COMMENTS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${COMMENTS_COLLECTION}`);
  }
  // Knowledge base articles collection (full vector for semantic search)
  try {
    await client.getCollection(KB_COLLECTION);
  } catch {
    await client.createCollection(KB_COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${KB_COLLECTION}`);
  }
  // Personal notes collection (dummy vector, payload-only)
  try {
    await client.getCollection(NOTES_COLLECTION);
  } catch {
    await client.createCollection(NOTES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${NOTES_COLLECTION}`);
  }
  // Resumes collection (dummy vector, payload-only)
  try {
    await client.getCollection(RESUMES_COLLECTION);
  } catch {
    await client.createCollection(RESUMES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${RESUMES_COLLECTION}`);
  }
  // Feedback collection (dummy vector, payload-only)
  try {
    await client.getCollection(FEEDBACK_COLLECTION);
  } catch {
    await client.createCollection(FEEDBACK_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${FEEDBACK_COLLECTION}`);
  }
  // Daily tasks collection (dummy vector, payload-only)
  try {
    await client.getCollection(TASKS_COLLECTION);
  } catch {
    await client.createCollection(TASKS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${TASKS_COLLECTION}`);
  }
  // Device assets collection (dummy vector, payload-only)
  try {
    await client.getCollection(DEVICES_COLLECTION);
  } catch {
    await client.createCollection(DEVICES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${DEVICES_COLLECTION}`);
  }
  // Recognitions collection (dummy vector, payload-only)
  try {
    await client.getCollection(RECOGNITION_COLLECTION);
  } catch {
    await client.createCollection(RECOGNITION_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${RECOGNITION_COLLECTION}`);
  }
  // Internal jobs collection (dummy vector, payload-only)
  try {
    await client.getCollection(JOBS_COLLECTION);
  } catch {
    await client.createCollection(JOBS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${JOBS_COLLECTION}`);
  }
  // Employees directory collection (dummy vector, payload-only)
  try {
    await client.getCollection(EMPLOYEES_COLLECTION);
  } catch {
    await client.createCollection(EMPLOYEES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${EMPLOYEES_COLLECTION}`);
  }
  // User profiles collection (dummy vector, payload-only)
  try {
    await client.getCollection(PROFILES_COLLECTION);
  } catch {
    await client.createCollection(PROFILES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${PROFILES_COLLECTION}`);
  }
  // Polls collection (dummy vector, payload-only)
  try {
    await client.getCollection(POLLS_COLLECTION);
  } catch {
    await client.createCollection(POLLS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${POLLS_COLLECTION}`);
  }

  // Leave Status collection (dummy vector, payload-only)
  try {
    await client.getCollection(LEAVE_STATUS_COLLECTION);
  } catch {
    await client.createCollection(LEAVE_STATUS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${LEAVE_STATUS_COLLECTION}`);
  }

  // Announcements collection (dummy vector, payload-only)
  try {
    await client.getCollection(ANNOUNCEMENTS_COLLECTION);
  } catch {
    await client.createCollection(ANNOUNCEMENTS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${ANNOUNCEMENTS_COLLECTION}`);
  }

  // Bookings collection (dummy vector, payload-only)
  try {
    await client.getCollection(BOOKINGS_COLLECTION);
  } catch {
    await client.createCollection(BOOKINGS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${BOOKINGS_COLLECTION}`);
  }

  // Quick Links collection (dummy vector, payload-only)
  try {
    await client.getCollection(QUICKLINKS_COLLECTION);
  } catch {
    await client.createCollection(QUICKLINKS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${QUICKLINKS_COLLECTION}`);
  }

  // Standup Pages collection
  try {
    await client.getCollection(STANDUP_PAGES_COLLECTION);
  } catch {
    await client.createCollection(STANDUP_PAGES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${STANDUP_PAGES_COLLECTION}`);
  }

  // Standup Entries collection
  try {
    await client.getCollection(STANDUP_ENTRIES_COLLECTION);
  } catch {
    await client.createCollection(STANDUP_ENTRIES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${STANDUP_ENTRIES_COLLECTION}`);
  }

  // Meetings collection
  try {
    await client.getCollection(MEETINGS_COLLECTION);
  } catch {
    await client.createCollection(MEETINGS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${MEETINGS_COLLECTION}`);
  }

  // Standup Messages collection
  try {
    await client.getCollection(STANDUP_MESSAGES_COLLECTION);
  } catch {
    await client.createCollection(STANDUP_MESSAGES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${STANDUP_MESSAGES_COLLECTION}`);
  }

  // Wishes collection
  try {
    await client.getCollection(WISHES_COLLECTION);
  } catch {
    await client.createCollection(WISHES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${WISHES_COLLECTION}`);
  }

  // Ideas collection
  try {
    await client.getCollection(IDEAS_COLLECTION);
  } catch {
    await client.createCollection(IDEAS_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${IDEAS_COLLECTION}`);
  }

  // Quizzes collection
  try {
    await client.getCollection(QUIZZES_COLLECTION);
  } catch {
    await client.createCollection(QUIZZES_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${QUIZZES_COLLECTION}`);
  }

  // Photo Gallery collection
  try {
    await client.getCollection(GALLERY_COLLECTION);
  } catch {
    await client.createCollection(GALLERY_COLLECTION, {
      vectors: { size: 4, distance: 'Cosine' },
    });
    console.log(`Created Qdrant collection: ${GALLERY_COLLECTION}`);
  }
}

async function getEmbedding(text) {
  const res = await fetch(OLLAMA_EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`Embedding failed: ${res.status}`);
  const data = await res.json();
  return data.embeddings[0];
}

function buildEmbedText(asset) {
  return [
    asset.name,
    asset.type,
    asset.lang || asset.language || '',
    asset.category || '',
    asset.desc || asset.description || '',
    (asset.tags || []).join(' '),
    asset.code ? asset.code.substring(0, 500) : '',
  ].filter(Boolean).join(' | ');
}

function toPointId(id) {
  const n = parseInt(id, 10);
  if (!isNaN(n) && n > 0) return n;
  // Fallback: hash the string to generate a numeric ID
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = ((hash << 5) - hash + String(id).charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

async function upsertAsset(asset) {
  const text = buildEmbedText(asset);
  const vector = await getEmbedding(text);
  const pointId = toPointId(asset.id);
  await client.upsert(COLLECTION, {
    wait: true,
    points: [{
      id: pointId,
      vector,
      payload: {
        originalId: String(asset.id),
        name: asset.name || '',
        type: asset.type || '',
        lang: asset.lang || asset.language || '',
        category: asset.category || '',
        desc: asset.desc || asset.description || '',
        author: asset.author || '',
        version: asset.version || '1.0.0',
        code: asset.code || '',
        tags: asset.tags || [],
        stars: asset.stars || 0,
        downloads: asset.downloads || 0,
        status: asset.status || 'Under Review',
        submittedBy: asset.submittedBy || '',
        reusabilityLevel: asset.reusabilityLevel || null,
        score: asset.score || null,
        aiAnalysis: asset.aiAnalysis ? JSON.stringify(asset.aiAnalysis) : null,
        createdAt: asset.createdAt || new Date().toISOString(),
        favoritedBy: asset.favoritedBy || [],
        ratings: asset.ratings || {},
        ratingCount: asset.ratingCount || 0,
        originalFileName: asset.originalFileName || '',
        rejectionComment: asset.rejectionComment || '',
        rejectedBy: asset.rejectedBy || '',
        reviewedBy: asset.reviewedBy || '',
      },
    }],
  });
}

async function searchAssets(query, { type, category, level, limit = 20 } = {}) {
  const vector = await getEmbedding(query);

  const filter = { must: [] };
  if (type && type !== 'All') {
    filter.must.push({ key: 'type', match: { value: type } });
  }
  if (category && category !== 'All') {
    filter.must.push({ key: 'category', match: { value: category } });
  }
  if (level && level !== 'All Levels') {
    const levelMap = { 'Production-Ready': 1, 'Verified': 2, 'Reference': 3, 'Deprecated': 4 };
    if (levelMap[level]) {
      filter.must.push({ key: 'reusabilityLevel', match: { value: levelMap[level] } });
    }
  }

  const results = await client.query(COLLECTION, {
    query: vector,
    limit,
    with_payload: true,
    filter: filter.must.length > 0 ? filter : undefined,
  });

  return results.points.map(p => ({
    id: p.payload.originalId || String(p.id),
    ...p.payload,
    aiAnalysis: p.payload.aiAnalysis ? JSON.parse(p.payload.aiAnalysis) : null,
    relevance: Math.round(p.score * 100),
  }));
}

async function getAllAssets({ type, category, level, status, limit = 100 } = {}) {
  const filter = { must: [] };
  if (type && type !== 'All') {
    filter.must.push({ key: 'type', match: { value: type } });
  }
  if (category && category !== 'All') {
    filter.must.push({ key: 'category', match: { value: category } });
  }
  if (status) {
    filter.must.push({ key: 'status', match: { value: status } });
  }
  if (level && level !== 'All Levels') {
    const levelMap = { 'Production-Ready': 1, 'Verified': 2, 'Reference': 3, 'Deprecated': 4 };
    if (levelMap[level]) {
      filter.must.push({ key: 'reusabilityLevel', match: { value: levelMap[level] } });
    }
  }

  const result = await client.scroll(COLLECTION, {
    limit,
    with_payload: true,
    filter: filter.must.length > 0 ? filter : undefined,
  });

  return result.points.map(p => ({
    id: p.payload.originalId || String(p.id),
    ...p.payload,
    aiAnalysis: p.payload.aiAnalysis ? JSON.parse(p.payload.aiAnalysis) : null,
  }));
}

async function getAssetById(id) {
  try {
    const pointId = toPointId(id);
    const points = await client.retrieve(COLLECTION, { ids: [pointId], with_payload: true });
    if (points.length === 0) return null;
    const p = points[0];
    return {
      id: p.payload.originalId || String(p.id),
      ...p.payload,
      aiAnalysis: p.payload.aiAnalysis ? JSON.parse(p.payload.aiAnalysis) : null,
    };
  } catch {
    return null;
  }
}

async function deleteAsset(id) {
  const pointId = toPointId(id);
  await client.delete(COLLECTION, { wait: true, points: [pointId] });
}

async function updateAsset(id, updates) {
  const existing = await getAssetById(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, id };
  await upsertAsset(merged);
  return merged;
}

async function getStats() {
  const all = await getAllAssets();
  const approved = all.filter(a => a.status === 'Approved');
  const byType = { Code: 0, Document: 0 };
  const byLevel = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byStatus = { Approved: 0, 'Under Review': 0, Rejected: 0, Draft: 0 };
  const byCategory = {};
  const authors = new Set();
  let totalStars = 0;
  let totalDownloads = 0;

  // byStatus counts all assets (for pending/draft alerts)
  for (const a of all) {
    if (a.status && byStatus[a.status] !== undefined) byStatus[a.status]++;
  }

  // All other stats only count approved assets
  for (const a of approved) {
    if (byType[a.type] !== undefined) byType[a.type]++;
    if (a.reusabilityLevel) byLevel[a.reusabilityLevel]++;
    if (a.category) byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    if (a.author) authors.add(a.author);
    totalStars += a.stars || 0;
    totalDownloads += a.downloads || 0;
  }

  return {
    total: approved.length,
    byType,
    byLevel,
    byStatus,
    byCategory,
    contributors: authors.size,
    totalStars,
    totalDownloads,
    recentAssets: approved.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
  };
}

// ──────────── Activity Log ────────────────────────────────
async function logActivity({ action, assetId, assetName, user, details }) {
  const id = Date.now();
  const dummyVector = [0, 0, 0, 0];
  await client.upsert(ACTIVITY_COLLECTION, {
    wait: true,
    points: [{
      id,
      vector: dummyVector,
      payload: {
        action,         // 'upload', 'approve', 'reject', 'delete', 'download', 'comment', 'rate', 'favorite'
        assetId: assetId || '',
        assetName: assetName || '',
        user: user || '',
        details: details || '',
        timestamp: new Date().toISOString(),
      },
    }],
  });
  return { id, action, assetName, user, timestamp: new Date().toISOString() };
}

async function getActivityLog(limit = 50) {
  const result = await client.scroll(ACTIVITY_COLLECTION, {
    limit,
    with_payload: true,
  });
  return result.points
    .map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ──────────── Comments ────────────────────────────────────
async function addComment({ assetId, user, text }) {
  const id = Date.now();
  const dummyVector = [0, 0, 0, 0];
  await client.upsert(COMMENTS_COLLECTION, {
    wait: true,
    points: [{
      id,
      vector: dummyVector,
      payload: {
        commentId: String(id),
        assetId: String(assetId),
        user: user || '',
        text: text || '',
        timestamp: new Date().toISOString(),
      },
    }],
  });
  return { id: String(id), assetId, user, text, timestamp: new Date().toISOString() };
}

async function getCommentsByAsset(assetId) {
  const result = await client.scroll(COMMENTS_COLLECTION, {
    limit: 100,
    with_payload: true,
    filter: { must: [{ key: 'assetId', match: { value: String(assetId) } }] },
  });
  return result.points
    .map(p => ({ id: p.payload.commentId || String(p.id), ...p.payload }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function deleteComment(commentId) {
  const pointId = parseInt(commentId, 10);
  if (isNaN(pointId)) return;
  await client.delete(COMMENTS_COLLECTION, { wait: true, points: [pointId] });
}

// ──────────── Favorites (stored as payload field on asset) ──
async function toggleFavorite(assetId, username) {
  const asset = await getAssetById(assetId);
  if (!asset) return null;
  const favorites = asset.favoritedBy || [];
  const isFav = favorites.includes(username);
  const newFavorites = isFav ? favorites.filter(u => u !== username) : [...favorites, username];
  await updateAsset(assetId, { favoritedBy: newFavorites });
  return { favorited: !isFav, count: newFavorites.length };
}

async function getUserFavorites(username) {
  const all = await getAllAssets();
  return all.filter(a => (a.favoritedBy || []).includes(username));
}

// ──────────── Ratings (stored as payload on asset) ─────────
async function rateAsset(assetId, username, rating) {
  const asset = await getAssetById(assetId);
  if (!asset) return null;
  const ratings = asset.ratings || {};
  ratings[username] = rating;
  const values = Object.values(ratings);
  const avgRating = values.reduce((a, b) => a + b, 0) / values.length;
  await updateAsset(assetId, { ratings, stars: Math.round(avgRating * 10) / 10, ratingCount: values.length });
  return { avgRating: Math.round(avgRating * 10) / 10, count: values.length, userRating: rating };
}

async function getAssetRatings(assetId) {
  const asset = await getAssetById(assetId);
  if (!asset) return { avgRating: 0, count: 0, ratings: {} };
  const ratings = asset.ratings || {};
  const values = Object.values(ratings);
  const avgRating = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return { avgRating: Math.round(avgRating * 10) / 10, count: values.length, ratings };
}

// ──────────── Similar Assets (for duplicate detection) ─────
async function findSimilarAssets(text, threshold = 0.7, limit = 5) {
  const vector = await getEmbedding(text);
  const results = await client.query(COLLECTION, {
    query: vector,
    limit,
    with_payload: true,
  });
  return results.points
    .filter(p => p.score >= threshold)
    .map(p => ({
      id: p.payload.originalId || String(p.id),
      name: p.payload.name,
      type: p.payload.type,
      similarity: Math.round(p.score * 100),
      status: p.payload.status,
    }));
}

// ──────────── Knowledge Base Articles ─────────────────────
async function addKBArticle({ title, content, category, source, addedBy }) {
  const id = Date.now();
  const embedText = [title, category, content.substring(0, 2000)].filter(Boolean).join(' | ');
  const vector = await getEmbedding(embedText);
  await client.upsert(KB_COLLECTION, {
    wait: true,
    points: [{
      id,
      vector,
      payload: {
        articleId: String(id),
        title: title || '',
        content: content || '',
        category: category || 'General',
        source: source || '',
        addedBy: addedBy || '',
        createdAt: new Date().toISOString(),
      },
    }],
  });
  return { id: String(id), title, content, category, source, addedBy, createdAt: new Date().toISOString() };
}

async function getAllKBArticles() {
  const result = await client.scroll(KB_COLLECTION, {
    limit: 200,
    with_payload: true,
  });
  return result.points.map(p => ({ id: p.payload.articleId || String(p.id), ...p.payload }));
}

async function deleteKBArticle(articleId) {
  const pointId = parseInt(articleId, 10);
  if (isNaN(pointId)) return;
  await client.delete(KB_COLLECTION, { wait: true, points: [pointId] });
}

async function searchKBArticles(query, limit = 5) {
  const vector = await getEmbedding(query);
  const results = await client.query(KB_COLLECTION, {
    query: vector,
    limit,
    with_payload: true,
  });
  return results.points
    .filter(p => p.score >= 0.3)
    .map(p => ({
      id: p.payload.articleId || String(p.id),
      title: p.payload.title,
      content: p.payload.content,
      category: p.payload.category,
      source: p.payload.source,
      relevance: Math.round(p.score * 100),
    }));
}

// ── Personal Notes ──────────────────────────────────────
async function addNote(username, { title, content, color }) {
  const id = Date.now();
  await client.upsert(NOTES_COLLECTION, {
    wait: true,
    points: [{
      id,
      vector: [0, 0, 0, 0],
      payload: { username, title, content, color: color || 'yellow', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    }],
  });
  return { id, title, content, color: color || 'yellow' };
}

async function getUserNotes(username) {
  const result = await client.scroll(NOTES_COLLECTION, {
    filter: { must: [{ key: 'username', match: { value: username } }] },
    limit: 500,
    with_payload: true,
  });
  return (result.points || []).map(p => ({
    id: String(p.id),
    title: p.payload.title,
    content: p.payload.content,
    color: p.payload.color,
    createdAt: p.payload.createdAt,
    updatedAt: p.payload.updatedAt,
  })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function updateNote(noteId, username, fields) {
  const existing = await client.retrieve(NOTES_COLLECTION, { ids: [Number(noteId)], with_payload: true });
  if (!existing.length) throw new Error('Note not found');
  if (existing[0].payload.username !== username) throw new Error('Not authorized');
  const merged = { ...existing[0].payload, ...fields, updatedAt: new Date().toISOString() };
  await client.upsert(NOTES_COLLECTION, {
    wait: true,
    points: [{ id: Number(noteId), vector: [0, 0, 0, 0], payload: merged }],
  });
  return { id: noteId, ...merged };
}

async function deleteNote(noteId, username) {
  const existing = await client.retrieve(NOTES_COLLECTION, { ids: [Number(noteId)], with_payload: true });
  if (!existing.length) throw new Error('Note not found');
  if (existing[0].payload.username !== username) throw new Error('Not authorized');
  await client.delete(NOTES_COLLECTION, { wait: true, points: [Number(noteId)] });
  return { deleted: true };
}

// ── Resumes ─────────────────────────────────────────────
async function saveResume(username, data) {
  const id = data.id ? Number(data.id) : Date.now();
  const now = new Date().toISOString();
  const payload = {
    username,
    template: data.template || 'classic',
    fullName: data.fullName || '',
    jobTitle: data.jobTitle || '',
    email: data.email || '',
    phone: data.phone || '',
    location: data.location || '',
    summary: data.summary || '',
    experience: data.experience || [],
    education: data.education || [],
    skills: data.skills || [],
    projects: data.projects || [],
    certifications: data.certifications || [],
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
  await client.upsert(RESUMES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id: String(id), ...payload };
}

async function getUserResumes(username) {
  const result = await client.scroll(RESUMES_COLLECTION, {
    filter: { must: [{ key: 'username', match: { value: username } }] },
    limit: 100,
    with_payload: true,
  });
  return (result.points || []).map(p => ({
    id: String(p.id),
    ...p.payload,
  })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getResumeById(resumeId) {
  const result = await client.retrieve(RESUMES_COLLECTION, { ids: [Number(resumeId)], with_payload: true });
  if (!result.length) throw new Error('Resume not found');
  return { id: String(result[0].id), ...result[0].payload };
}

async function deleteResume(resumeId, username) {
  const existing = await client.retrieve(RESUMES_COLLECTION, { ids: [Number(resumeId)], with_payload: true });
  if (!existing.length) throw new Error('Resume not found');
  if (existing[0].payload.username !== username) throw new Error('Not authorized');
  await client.delete(RESUMES_COLLECTION, { wait: true, points: [Number(resumeId)] });
  return { deleted: true };
}

// ── Feedback ────────────────────────────────────────────
async function createFeedback(username, displayName, { title, content, category }) {
  const id = Date.now();
  const payload = {
    username, displayName,
    title, content,
    category: category || 'general',
    replies: [],
    likes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await client.upsert(FEEDBACK_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id: String(id), ...payload };
}

async function getAllFeedback() {
  const result = await client.scroll(FEEDBACK_COLLECTION, {
    limit: 500,
    with_payload: true,
  });
  return (result.points || []).map(p => ({
    id: String(p.id),
    ...p.payload,
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addReply(feedbackId, username, displayName, text) {
  const existing = await client.retrieve(FEEDBACK_COLLECTION, { ids: [Number(feedbackId)], with_payload: true });
  if (!existing.length) throw new Error('Feedback not found');
  const payload = existing[0].payload;
  const reply = { id: String(Date.now()), username, displayName, text, createdAt: new Date().toISOString() };
  payload.replies = [...(payload.replies || []), reply];
  payload.updatedAt = new Date().toISOString();
  await client.upsert(FEEDBACK_COLLECTION, {
    wait: true,
    points: [{ id: Number(feedbackId), vector: [0, 0, 0, 0], payload }],
  });
  return reply;
}

async function toggleFeedbackLike(feedbackId, username) {
  const existing = await client.retrieve(FEEDBACK_COLLECTION, { ids: [Number(feedbackId)], with_payload: true });
  if (!existing.length) throw new Error('Feedback not found');
  const payload = existing[0].payload;
  const likes = payload.likes || [];
  const idx = likes.indexOf(username);
  if (idx >= 0) likes.splice(idx, 1); else likes.push(username);
  payload.likes = likes;
  await client.upsert(FEEDBACK_COLLECTION, {
    wait: true,
    points: [{ id: Number(feedbackId), vector: [0, 0, 0, 0], payload }],
  });
  return { liked: idx < 0, count: likes.length };
}

async function updateFeedback(feedbackId, username, role, { title, content, category }) {
  const existing = await client.retrieve(FEEDBACK_COLLECTION, { ids: [Number(feedbackId)], with_payload: true });
  if (!existing.length) throw new Error('Feedback not found');
  const payload = existing[0].payload;
  if (payload.username !== username && role !== 'admin') throw new Error('Not authorized');
  if (title !== undefined) payload.title = title;
  if (content !== undefined) payload.content = content;
  if (category !== undefined) payload.category = category;
  payload.updatedAt = new Date().toISOString();
  await client.upsert(FEEDBACK_COLLECTION, {
    wait: true,
    points: [{ id: Number(feedbackId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: feedbackId, ...payload };
}

async function deleteFeedback(feedbackId, username, role) {
  const existing = await client.retrieve(FEEDBACK_COLLECTION, { ids: [Number(feedbackId)], with_payload: true });
  if (!existing.length) throw new Error('Feedback not found');
  if (existing[0].payload.username !== username && role !== 'admin') throw new Error('Not authorized');
  await client.delete(FEEDBACK_COLLECTION, { wait: true, points: [Number(feedbackId)] });
  return { deleted: true };
}

async function deleteReply(feedbackId, replyId, username) {
  const existing = await client.retrieve(FEEDBACK_COLLECTION, { ids: [Number(feedbackId)], with_payload: true });
  if (!existing.length) throw new Error('Feedback not found');
  const payload = existing[0].payload;
  const replyIdx = (payload.replies || []).findIndex(r => r.id === replyId);
  if (replyIdx < 0) throw new Error('Reply not found');
  if (payload.replies[replyIdx].username !== username) throw new Error('Not authorized');
  payload.replies.splice(replyIdx, 1);
  payload.updatedAt = new Date().toISOString();
  await client.upsert(FEEDBACK_COLLECTION, {
    wait: true,
    points: [{ id: Number(feedbackId), vector: [0, 0, 0, 0], payload }],
  });
  return { deleted: true };
}

async function toggleReplyLike(feedbackId, replyId, username) {
  const existing = await client.retrieve(FEEDBACK_COLLECTION, { ids: [Number(feedbackId)], with_payload: true });
  if (!existing.length) throw new Error('Feedback not found');
  const payload = existing[0].payload;
  const reply = (payload.replies || []).find(r => r.id === replyId);
  if (!reply) throw new Error('Reply not found');
  const likes = reply.likes || [];
  const idx = likes.indexOf(username);
  if (idx >= 0) likes.splice(idx, 1); else likes.push(username);
  reply.likes = likes;
  await client.upsert(FEEDBACK_COLLECTION, {
    wait: true,
    points: [{ id: Number(feedbackId), vector: [0, 0, 0, 0], payload }],
  });
  return { liked: idx < 0, count: likes.length };
}

// ── Daily Task Tracker ──────────────────────────────────
// Each daily log is keyed by username + date (YYYY-MM-DD) as a unique numeric ID
function dateToId(username, date) {
  // Create a deterministic numeric ID from username+date
  let hash = 0;
  const str = `${username}:${date}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

async function saveDailyLog(username, date, data) {
  const id = dateToId(username, date);
  const now = new Date().toISOString();
  // Try to get existing
  let existing = null;
  try {
    const result = await client.retrieve(TASKS_COLLECTION, { ids: [id], with_payload: true });
    if (result.length && result[0].payload.username === username && result[0].payload.date === date) {
      existing = result[0].payload;
    }
  } catch { /* not found */ }

  const payload = {
    username,
    date,
    tasks: data.tasks || (existing ? existing.tasks : []),
    updates: data.updates !== undefined ? data.updates : (existing ? existing.updates : ''),
    nextDayPlan: data.nextDayPlan !== undefined ? data.nextDayPlan : (existing ? existing.nextDayPlan : ''),
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await client.upsert(TASKS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id: String(id), ...payload };
}

async function getDailyLog(username, date) {
  const id = dateToId(username, date);
  try {
    const result = await client.retrieve(TASKS_COLLECTION, { ids: [id], with_payload: true });
    if (result.length && result[0].payload.username === username && result[0].payload.date === date) {
      return { id: String(result[0].id), ...result[0].payload };
    }
  } catch { /* not found */ }
  return null;
}

async function getUserTaskLogs(username, limit = 30) {
  const result = await client.scroll(TASKS_COLLECTION, {
    filter: { must: [{ key: 'username', match: { value: username } }] },
    limit,
    with_payload: true,
  });
  return (result.points || []).map(p => ({
    id: String(p.id),
    ...p.payload,
  })).sort((a, b) => b.date.localeCompare(a.date));
}

// ── Device Asset Management ─────────────────────────────
async function addDevice(data) {
  const id = Date.now();
  const now = new Date().toISOString();
  const payload = {
    name: data.name || '',
    type: data.type || 'laptop',
    serialNumber: data.serialNumber || '',
    manufacturer: data.manufacturer || '',
    model: data.model || '',
    purchaseDate: data.purchaseDate || '',
    warrantyExpiry: data.warrantyExpiry || '',
    status: data.status || 'available',
    assignedTo: data.assignedTo || '',
    assignedBy: data.assignedBy || '',
    assignedDate: data.assignedDate || '',
    location: data.location || '',
    notes: data.notes || '',
    specs: data.specs || '',
    addedBy: data.addedBy || '',
    createdAt: now,
    updatedAt: now,
  };
  await client.upsert(DEVICES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id: String(id), ...payload };
}

async function getAllDevices(filters = {}) {
  const must = [];
  if (filters.type) must.push({ key: 'type', match: { value: filters.type } });
  if (filters.status) must.push({ key: 'status', match: { value: filters.status } });
  if (filters.assignedTo) must.push({ key: 'assignedTo', match: { value: filters.assignedTo } });

  const result = await client.scroll(DEVICES_COLLECTION, {
    filter: must.length ? { must } : undefined,
    limit: 500,
    with_payload: true,
  });
  return (result.points || []).map(p => ({
    id: String(p.id),
    ...p.payload,
  })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getDeviceById(deviceId) {
  const result = await client.retrieve(DEVICES_COLLECTION, { ids: [Number(deviceId)], with_payload: true });
  if (!result.length) throw new Error('Device not found');
  return { id: String(result[0].id), ...result[0].payload };
}

async function updateDevice(deviceId, fields) {
  const existing = await client.retrieve(DEVICES_COLLECTION, { ids: [Number(deviceId)], with_payload: true });
  if (!existing.length) throw new Error('Device not found');
  const merged = { ...existing[0].payload, ...fields, updatedAt: new Date().toISOString() };
  await client.upsert(DEVICES_COLLECTION, {
    wait: true,
    points: [{ id: Number(deviceId), vector: [0, 0, 0, 0], payload: merged }],
  });
  return { id: deviceId, ...merged };
}

async function deleteDevice(deviceId) {
  await client.delete(DEVICES_COLLECTION, { wait: true, points: [Number(deviceId)] });
  return { deleted: true };
}

// ── Recognition System ──────────────────────────────────
async function createRecognition({ from, fromName, to, toName, message, tags }) {
  const id = Date.now();
  const payload = { from, fromName, to, toName, message, tags: tags || [], likes: [], createdAt: new Date().toISOString() };
  await client.upsert(RECOGNITION_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

async function getAllRecognitions() {
  const result = await client.scroll(RECOGNITION_COLLECTION, { limit: 1000, with_payload: true });
  return result.points.map(p => ({ id: p.id, ...p.payload })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function toggleRecognitionLike(recId, username) {
  const existing = await client.retrieve(RECOGNITION_COLLECTION, { ids: [Number(recId)], with_payload: true });
  if (!existing.length) throw new Error('Recognition not found');
  const payload = existing[0].payload;
  const likes = payload.likes || [];
  const idx = likes.indexOf(username);
  if (idx >= 0) likes.splice(idx, 1); else likes.push(username);
  payload.likes = likes;
  await client.upsert(RECOGNITION_COLLECTION, {
    wait: true,
    points: [{ id: Number(recId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: recId, ...payload };
}

async function deleteRecognition(recId) {
  await client.delete(RECOGNITION_COLLECTION, { wait: true, points: [Number(recId)] });
  return { deleted: true };
}

// ── Internal Job Board ──────────────────────────────────
async function createJob({ title, department, type, location, description, requirements, postedBy, postedByName }) {
  const id = Date.now();
  const payload = {
    title, department, type, location, description,
    requirements: requirements || [], postedBy, postedByName,
    applicants: [], status: 'open',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await client.upsert(JOBS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

async function getAllJobs() {
  const result = await client.scroll(JOBS_COLLECTION, { limit: 1000, with_payload: true });
  return result.points.map(p => ({ id: p.id, ...p.payload })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getJobById(jobId) {
  const result = await client.retrieve(JOBS_COLLECTION, { ids: [Number(jobId)], with_payload: true });
  if (!result.length) throw new Error('Job not found');
  return { id: result[0].id, ...result[0].payload };
}

async function applyToJob(jobId, { username, name, note }) {
  const existing = await client.retrieve(JOBS_COLLECTION, { ids: [Number(jobId)], with_payload: true });
  if (!existing.length) throw new Error('Job not found');
  const payload = existing[0].payload;
  const applicants = payload.applicants || [];
  if (applicants.some(a => a.username === username)) throw new Error('Already applied');
  applicants.push({ username, name, note: note || '', appliedAt: new Date().toISOString(), status: 'pending' });
  payload.applicants = applicants;
  payload.updatedAt = new Date().toISOString();
  await client.upsert(JOBS_COLLECTION, {
    wait: true,
    points: [{ id: Number(jobId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: jobId, ...payload };
}

async function updateJobStatus(jobId, status) {
  const existing = await client.retrieve(JOBS_COLLECTION, { ids: [Number(jobId)], with_payload: true });
  if (!existing.length) throw new Error('Job not found');
  const payload = existing[0].payload;
  payload.status = status;
  payload.updatedAt = new Date().toISOString();
  await client.upsert(JOBS_COLLECTION, {
    wait: true,
    points: [{ id: Number(jobId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: jobId, ...payload };
}

async function updateApplicantStatus(jobId, username, status) {
  const existing = await client.retrieve(JOBS_COLLECTION, { ids: [Number(jobId)], with_payload: true });
  if (!existing.length) throw new Error('Job not found');
  const payload = existing[0].payload;
  const applicant = (payload.applicants || []).find(a => a.username === username);
  if (!applicant) throw new Error('Applicant not found');
  applicant.status = status;
  payload.updatedAt = new Date().toISOString();
  await client.upsert(JOBS_COLLECTION, {
    wait: true,
    points: [{ id: Number(jobId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: jobId, ...payload };
}

async function deleteJob(jobId) {
  await client.delete(JOBS_COLLECTION, { wait: true, points: [Number(jobId)] });
  return { deleted: true };
}

// ── Employee Directory ──────────────────────────────────
async function addEmployee({ employeeId, name, email, phone, department, role, designation, skills, location, joinDate, avatar, bio, addedBy }) {
  // Check for duplicates by employeeId or email
  const existing = await client.scroll(EMPLOYEES_COLLECTION, { limit: 5000, with_payload: true });
  for (const p of existing.points) {
    if (employeeId && p.payload.employeeId && p.payload.employeeId === employeeId) {
      throw new Error(`Duplicate: Employee ID "${employeeId}" already exists`);
    }
    if (email && p.payload.email && p.payload.email.toLowerCase() === email.toLowerCase()) {
      throw new Error(`Duplicate: Email "${email}" already exists`);
    }
  }
  const id = Date.now();
  const payload = {
    employeeId: employeeId || '', name, email: email || '', phone: phone || '',
    department: department || '', role: role || '', designation: designation || '',
    skills: skills || [], location: location || 'EB India',
    joinDate: joinDate || '', avatar: avatar || '', bio: bio || '',
    addedBy, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await client.upsert(EMPLOYEES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

async function getAllEmployees() {
  const result = await client.scroll(EMPLOYEES_COLLECTION, { limit: 5000, with_payload: true });
  return result.points.map(p => ({ id: p.id, ...p.payload })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

async function getEmployeeById(empId) {
  const result = await client.retrieve(EMPLOYEES_COLLECTION, { ids: [Number(empId)], with_payload: true });
  if (!result.length) throw new Error('Employee not found');
  return { id: result[0].id, ...result[0].payload };
}

async function updateEmployee(empId, fields) {
  const existing = await client.retrieve(EMPLOYEES_COLLECTION, { ids: [Number(empId)], with_payload: true });
  if (!existing.length) throw new Error('Employee not found');
  const merged = { ...existing[0].payload, ...fields, updatedAt: new Date().toISOString() };
  await client.upsert(EMPLOYEES_COLLECTION, {
    wait: true,
    points: [{ id: Number(empId), vector: [0, 0, 0, 0], payload: merged }],
  });
  return { id: empId, ...merged };
}

async function deleteEmployee(empId) {
  await client.delete(EMPLOYEES_COLLECTION, { wait: true, points: [Number(empId)] });
  return { deleted: true };
}

// ---- User Profiles ----
function profileId(username) {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = ((h << 5) - h + username.charCodeAt(i)) >>> 0;
  return h || 1;
}

async function getProfile(username) {
  const id = profileId(username);
  try {
    const pts = await client.retrieve(PROFILES_COLLECTION, { ids: [id], with_payload: true });
    if (pts.length) return { id, ...pts[0].payload };
  } catch { /* not found */ }
  return null;
}

async function saveProfile(username, fields) {
  const id = profileId(username);
  const payload = { ...fields, username, updatedAt: new Date().toISOString() };
  await client.upsert(PROFILES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

// Normalize skills: supports both old format ["React"] and new format [{name,rating}]
function normalizeSkills(skills) {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(s => {
    if (typeof s === 'string') return { name: s, rating: 3 };
    return { name: s.name || '', rating: s.rating || 3 };
  });
}

async function searchEmployeesBySkill(skill, minRating = 1) {
  const q = (skill || '').toLowerCase();
  const results = [];
  const seen = new Set(); // track by email or username to avoid duplicates

  // Search employees collection
  const allEmps = await client.scroll(EMPLOYEES_COLLECTION, { limit: 5000, with_payload: true });
  for (const p of allEmps.points) {
    const skills = normalizeSkills(p.payload.skills);
    const matched = skills.filter(s => s.name.toLowerCase().includes(q) && s.rating >= minRating);
    if (matched.length > 0) {
      results.push({ id: p.id, source: 'employee', ...p.payload, skills, matchedSkills: matched });
      if (p.payload.email) seen.add(p.payload.email.toLowerCase());
    }
  }

  // Also search user profiles collection
  try {
    const allProfiles = await client.scroll(PROFILES_COLLECTION, { limit: 5000, with_payload: true });
    for (const p of allProfiles.points) {
      const pl = p.payload;
      // Skip if already matched from employees by email
      if (pl.email && seen.has(pl.email.toLowerCase())) continue;
      const skills = normalizeSkills(pl.skills);
      const matched = skills.filter(s => s.name.toLowerCase().includes(q) && s.rating >= minRating);
      if (matched.length > 0) {
        results.push({
          id: p.id,
          source: 'profile',
          name: pl.fullName || pl.username || '',
          email: pl.email || '',
          department: pl.team || '',
          designation: pl.role || '',
          skills,
          matchedSkills: matched,
          username: pl.username,
        });
      }
    }
  } catch { /* profiles collection may not exist yet */ }

  // Sort by highest matching skill rating descending
  results.sort((a, b) => {
    const aMax = Math.max(...a.matchedSkills.map(s => s.rating));
    const bMax = Math.max(...b.matchedSkills.map(s => s.rating));
    return bMax - aMax;
  });
  return results;
}

// ── Polls & Surveys ──────────────────────────────────
async function createPoll(username, displayName, { question, options, category, endsAt, allowMultiple }) {
  const id = Date.now();
  const payload = {
    id, username, displayName,
    question, category: category || 'general',
    options: (options || []).map((text, idx) => ({ id: idx, text, votes: [] })),
    allowMultiple: !!allowMultiple,
    endsAt: endsAt || null,
    closed: false,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(POLLS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getAllPolls() {
  const result = await client.scroll(POLLS_COLLECTION, { limit: 5000, with_payload: true });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function votePoll(pollId, username, optionIds) {
  const existing = await client.retrieve(POLLS_COLLECTION, { ids: [Number(pollId)], with_payload: true });
  if (!existing.length) throw new Error('Poll not found');
  const payload = existing[0].payload;
  if (payload.closed) throw new Error('Poll is closed');
  if (payload.endsAt && new Date(payload.endsAt) < new Date()) throw new Error('Poll has ended');

  // Remove previous votes by this user
  for (const opt of payload.options) {
    opt.votes = (opt.votes || []).filter(v => v !== username);
  }
  // Add new votes
  for (const optId of optionIds) {
    const opt = payload.options.find(o => o.id === optId);
    if (opt) opt.votes.push(username);
  }
  await client.upsert(POLLS_COLLECTION, {
    wait: true,
    points: [{ id: Number(pollId), vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function closePoll(pollId, username) {
  const existing = await client.retrieve(POLLS_COLLECTION, { ids: [Number(pollId)], with_payload: true });
  if (!existing.length) throw new Error('Poll not found');
  const payload = existing[0].payload;
  if (payload.username !== username) throw new Error('Not authorized');
  payload.closed = true;
  await client.upsert(POLLS_COLLECTION, {
    wait: true,
    points: [{ id: Number(pollId), vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function deletePoll(pollId, username, role) {
  const existing = await client.retrieve(POLLS_COLLECTION, { ids: [Number(pollId)], with_payload: true });
  if (!existing.length) throw new Error('Poll not found');
  if (existing[0].payload.username !== username && role !== 'admin') throw new Error('Not authorized');
  await client.delete(POLLS_COLLECTION, { wait: true, points: [Number(pollId)] });
  return { deleted: true };
}

// ── Leave / WFH Tracker ──────────────────────────────────
async function setLeaveStatus(username, displayName, { status, date, note }) {
  // Use a stable numeric ID per user+date combo so updates overwrite
  const key = `${username}_${date}`;
  let id = 0;
  for (let i = 0; i < key.length; i++) id = ((id << 5) - id + key.charCodeAt(i)) | 0;
  id = Math.abs(id);
  const payload = {
    id, username, displayName,
    status, // 'in-office' | 'wfh' | 'leave' | 'half-day'
    date,
    note: note || '',
    updatedAt: new Date().toISOString(),
  };
  await client.upsert(LEAVE_STATUS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getAllLeaveStatuses(date) {
  const result = await client.scroll(LEAVE_STATUS_COLLECTION, { limit: 5000, with_payload: true });
  let statuses = (result.points || []).map(p => ({ id: p.id, ...p.payload }));
  if (date) {
    statuses = statuses.filter(s => s.date === date);
  }
  return statuses.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

async function getUserLeaveHistory(username) {
  const result = await client.scroll(LEAVE_STATUS_COLLECTION, {
    limit: 5000, with_payload: true,
    filter: { must: [{ key: 'username', match: { value: username } }] },
  });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ── Announcements Board ──────────────────────────────────
async function createAnnouncement(username, displayName, { title, content, priority, pinned }) {
  const id = Date.now();
  const payload = {
    id, username, displayName,
    title, content,
    priority: priority || 'info', // 'urgent' | 'info' | 'event'
    pinned: !!pinned,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(ANNOUNCEMENTS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getAllAnnouncements() {
  const result = await client.scroll(ANNOUNCEMENTS_COLLECTION, { limit: 5000, with_payload: true });
  const items = (result.points || []).map(p => ({ id: p.id, ...p.payload }));
  // Pinned first, then by date descending
  return items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

async function toggleAnnouncementPin(announcementId, username, role) {
  const existing = await client.retrieve(ANNOUNCEMENTS_COLLECTION, { ids: [Number(announcementId)], with_payload: true });
  if (!existing.length) throw new Error('Announcement not found');
  const payload = existing[0].payload;
  if (payload.username !== username && role !== 'admin') throw new Error('Not authorized');
  payload.pinned = !payload.pinned;
  await client.upsert(ANNOUNCEMENTS_COLLECTION, {
    wait: true,
    points: [{ id: Number(announcementId), vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function deleteAnnouncement(announcementId, username, role) {
  const existing = await client.retrieve(ANNOUNCEMENTS_COLLECTION, { ids: [Number(announcementId)], with_payload: true });
  if (!existing.length) throw new Error('Announcement not found');
  if (existing[0].payload.username !== username && role !== 'admin') throw new Error('Not authorized');
  await client.delete(ANNOUNCEMENTS_COLLECTION, { wait: true, points: [Number(announcementId)] });
  return { deleted: true };
}

async function updateAnnouncement(announcementId, username, role, { title, content, priority }) {
  const existing = await client.retrieve(ANNOUNCEMENTS_COLLECTION, { ids: [Number(announcementId)], with_payload: true });
  if (!existing.length) throw new Error('Announcement not found');
  const payload = existing[0].payload;
  if (payload.username !== username && role !== 'admin') throw new Error('Not authorized');
  if (title !== undefined) payload.title = title;
  if (content !== undefined) payload.content = content;
  if (priority !== undefined) payload.priority = priority;
  payload.editedAt = new Date().toISOString();
  await client.upsert(ANNOUNCEMENTS_COLLECTION, {
    wait: true,
    points: [{ id: Number(announcementId), vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

// ── Booking System ──────────────────────────────────────
async function createBooking(username, displayName, { resource, resourceType, date, startTime, endTime, title, notes }) {
  // Check for conflicts
  const existing = await getBookingsForDate(date);
  const conflict = existing.find(b =>
    b.resource === resource &&
    b.id !== undefined &&
    ((startTime >= b.startTime && startTime < b.endTime) ||
     (endTime > b.startTime && endTime <= b.endTime) ||
     (startTime <= b.startTime && endTime >= b.endTime))
  );
  if (conflict) throw new Error(`Conflict: ${resource} is already booked by ${conflict.displayName} from ${conflict.startTime} to ${conflict.endTime}`);

  const id = Date.now();
  const payload = {
    id, username, displayName,
    resource, resourceType, // 'room' | 'desk' | 'equipment'
    date, startTime, endTime,
    title: title || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };
  await client.upsert(BOOKINGS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getBookingsForDate(date) {
  const result = await client.scroll(BOOKINGS_COLLECTION, {
    limit: 5000, with_payload: true,
    filter: { must: [{ key: 'date', match: { value: date } }] },
  });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

async function getAllBookings() {
  const result = await client.scroll(BOOKINGS_COLLECTION, { limit: 5000, with_payload: true });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
    });
}

async function deleteBooking(bookingId, username) {
  const existing = await client.retrieve(BOOKINGS_COLLECTION, { ids: [Number(bookingId)], with_payload: true });
  if (!existing.length) throw new Error('Booking not found');
  if (existing[0].payload.username !== username) throw new Error('Not authorized');
  await client.delete(BOOKINGS_COLLECTION, { wait: true, points: [Number(bookingId)] });
  return { deleted: true };
}

// ── Quick Links / Bookmarks ───────────────────────────────
async function createQuickLink({ url, title, description, category, tags, username, displayName }) {
  const id = Date.now();
  const payload = {
    id, url, title,
    description: description || '',
    category: category || 'Other',
    tags: tags || [],
    username, displayName,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(QUICKLINKS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getAllQuickLinks() {
  const result = await client.scroll(QUICKLINKS_COLLECTION, { limit: 5000, with_payload: true });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function updateQuickLink(linkId, updates) {
  const existing = await client.retrieve(QUICKLINKS_COLLECTION, { ids: [Number(linkId)], with_payload: true });
  if (!existing.length) throw new Error('Link not found');
  const payload = { ...existing[0].payload, ...updates };
  await client.upsert(QUICKLINKS_COLLECTION, {
    wait: true,
    points: [{ id: Number(linkId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(linkId), ...payload };
}

async function deleteQuickLink(linkId) {
  await client.delete(QUICKLINKS_COLLECTION, { wait: true, points: [Number(linkId)] });
  return { deleted: true };
}

// ── Standup Notes / Daily Scrum ─────────────────────────────────
async function createStandupPage({ name, description, createdBy, displayName, members }) {
  const id = Date.now();
  const payload = {
    id, name,
    description: description || '',
    createdBy, displayName,
    members: members || [createdBy],
    createdAt: new Date().toISOString(),
  };
  await client.upsert(STANDUP_PAGES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getAllStandupPages() {
  const result = await client.scroll(STANDUP_PAGES_COLLECTION, { limit: 5000, with_payload: true });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getStandupPage(pageId) {
  const existing = await client.retrieve(STANDUP_PAGES_COLLECTION, { ids: [Number(pageId)], with_payload: true });
  if (!existing.length) throw new Error('Standup page not found');
  return { id: existing[0].id, ...existing[0].payload };
}

async function updateStandupPageMembers(pageId, members) {
  const existing = await client.retrieve(STANDUP_PAGES_COLLECTION, { ids: [Number(pageId)], with_payload: true });
  if (!existing.length) throw new Error('Standup page not found');
  const payload = { ...existing[0].payload, members };
  await client.upsert(STANDUP_PAGES_COLLECTION, {
    wait: true,
    points: [{ id: Number(pageId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(pageId), ...payload };
}

async function deleteStandupPage(pageId) {
  await client.delete(STANDUP_PAGES_COLLECTION, { wait: true, points: [Number(pageId)] });
  // Also delete all entries for this page
  const entries = await client.scroll(STANDUP_ENTRIES_COLLECTION, {
    limit: 10000, with_payload: true,
    filter: { must: [{ key: 'pageId', match: { value: Number(pageId) } }] },
  });
  const ids = (entries.points || []).map(p => p.id);
  if (ids.length) await client.delete(STANDUP_ENTRIES_COLLECTION, { wait: true, points: ids });
  return { deleted: true };
}

async function addStandupEntry({ pageId, date, username, displayName, yesterday, today, blockers }) {
  const id = Date.now();
  const payload = {
    id, pageId: Number(pageId), date, username, displayName,
    yesterday: yesterday || '',
    today: today || '',
    blockers: blockers || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  };
  await client.upsert(STANDUP_ENTRIES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getStandupEntries(pageId, date) {
  const filter = { must: [{ key: 'pageId', match: { value: Number(pageId) } }] };
  if (date) filter.must.push({ key: 'date', match: { value: date } });
  const result = await client.scroll(STANDUP_ENTRIES_COLLECTION, {
    limit: 5000, with_payload: true, filter,
  });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function updateStandupEntry(entryId, { yesterday, today, blockers, username, displayName }) {
  const existing = await client.retrieve(STANDUP_ENTRIES_COLLECTION, { ids: [Number(entryId)], with_payload: true });
  if (!existing.length) throw new Error('Entry not found');
  const oldPayload = existing[0].payload;
  const historyEntry = {
    editedBy: username,
    editedByName: displayName,
    editedAt: new Date().toISOString(),
    previous: { yesterday: oldPayload.yesterday, today: oldPayload.today, blockers: oldPayload.blockers },
  };
  const history = [...(oldPayload.history || []), historyEntry];
  const payload = {
    ...oldPayload,
    yesterday: yesterday !== undefined ? yesterday : oldPayload.yesterday,
    today: today !== undefined ? today : oldPayload.today,
    blockers: blockers !== undefined ? blockers : oldPayload.blockers,
    updatedAt: new Date().toISOString(),
    history,
  };
  await client.upsert(STANDUP_ENTRIES_COLLECTION, {
    wait: true,
    points: [{ id: Number(entryId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(entryId), ...payload };
}

async function deleteStandupEntry(entryId) {
  await client.delete(STANDUP_ENTRIES_COLLECTION, { wait: true, points: [Number(entryId)] });
  return { deleted: true };
}

// ── Standup Messages ──
async function addStandupMessage(data) {
  const id = Date.now();
  const payload = {
    pageId: data.pageId,
    text: data.text,
    sender: data.sender,
    senderName: data.senderName,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(STANDUP_MESSAGES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0.1, 0.1, 0.1, 0.1], payload }],
  });
  return { id, ...payload };
}

async function getStandupMessages(pageId) {
  const result = await client.scroll(STANDUP_MESSAGES_COLLECTION, {
    filter: { must: [{ key: 'pageId', match: { value: String(pageId) } }] },
    limit: 500,
    with_payload: true,
  });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function deleteStandupMessage(msgId) {
  await client.delete(STANDUP_MESSAGES_COLLECTION, { wait: true, points: [Number(msgId)] });
  return { deleted: true };
}

// ── Meeting Minutes ─────────────────────────────────────────────
async function createMeeting({ title, date, time, attendees, notes, createdBy, displayName }) {
  const id = Date.now();
  const payload = {
    id, title,
    date: date || new Date().toISOString().split('T')[0],
    time: time || '',
    attendees: attendees || [],
    notes: notes || '',
    actionItems: [],
    createdBy, displayName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await client.upsert(MEETINGS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return payload;
}

async function getAllMeetings() {
  const result = await client.scroll(MEETINGS_COLLECTION, { limit: 5000, with_payload: true });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getMeeting(meetingId) {
  const existing = await client.retrieve(MEETINGS_COLLECTION, { ids: [Number(meetingId)], with_payload: true });
  if (!existing.length) throw new Error('Meeting not found');
  return { id: existing[0].id, ...existing[0].payload };
}

async function updateMeeting(meetingId, updates) {
  const existing = await client.retrieve(MEETINGS_COLLECTION, { ids: [Number(meetingId)], with_payload: true });
  if (!existing.length) throw new Error('Meeting not found');
  const payload = { ...existing[0].payload, ...updates, updatedAt: new Date().toISOString() };
  await client.upsert(MEETINGS_COLLECTION, {
    wait: true,
    points: [{ id: Number(meetingId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(meetingId), ...payload };
}

async function deleteMeeting(meetingId) {
  await client.delete(MEETINGS_COLLECTION, { wait: true, points: [Number(meetingId)] });
  return { deleted: true };
}

async function addActionItem(meetingId, { title, assignee, dueDate, status }) {
  const existing = await client.retrieve(MEETINGS_COLLECTION, { ids: [Number(meetingId)], with_payload: true });
  if (!existing.length) throw new Error('Meeting not found');
  const payload = existing[0].payload;
  const actionId = Date.now();
  const action = { id: actionId, title, assignee: assignee || '', dueDate: dueDate || '', status: status || 'pending', createdAt: new Date().toISOString() };
  payload.actionItems = [...(payload.actionItems || []), action];
  payload.updatedAt = new Date().toISOString();
  await client.upsert(MEETINGS_COLLECTION, {
    wait: true,
    points: [{ id: Number(meetingId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(meetingId), ...payload };
}

async function updateActionItem(meetingId, actionId, updates) {
  const existing = await client.retrieve(MEETINGS_COLLECTION, { ids: [Number(meetingId)], with_payload: true });
  if (!existing.length) throw new Error('Meeting not found');
  const payload = existing[0].payload;
  payload.actionItems = (payload.actionItems || []).map(a =>
    a.id === Number(actionId) ? { ...a, ...updates } : a
  );
  payload.updatedAt = new Date().toISOString();
  await client.upsert(MEETINGS_COLLECTION, {
    wait: true,
    points: [{ id: Number(meetingId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(meetingId), ...payload };
}

async function deleteActionItem(meetingId, actionId) {
  const existing = await client.retrieve(MEETINGS_COLLECTION, { ids: [Number(meetingId)], with_payload: true });
  if (!existing.length) throw new Error('Meeting not found');
  const payload = existing[0].payload;
  payload.actionItems = (payload.actionItems || []).filter(a => a.id !== Number(actionId));
  payload.updatedAt = new Date().toISOString();
  await client.upsert(MEETINGS_COLLECTION, {
    wait: true,
    points: [{ id: Number(meetingId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: Number(meetingId), ...payload };
}

// ── Wishes ──
async function createWish(data) {
  const id = Date.now();
  const payload = {
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    senderName: data.senderName,
    senderUsername: data.senderUsername,
    type: data.type,
    message: data.message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(WISHES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0.1, 0.1, 0.1, 0.1], payload }],
  });
  return { id, ...payload };
}

async function getWishesForUser(name) {
  const result = await client.scroll(WISHES_COLLECTION, {
    filter: { must: [{ key: 'recipientName', match: { value: name } }] },
    limit: 100,
    with_payload: true,
  });
  return (result.points || []).map(p => ({ id: p.id, ...p.payload })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function markWishRead(wishId) {
  const existing = await client.retrieve(WISHES_COLLECTION, { ids: [Number(wishId)], with_payload: true });
  if (!existing.length) throw new Error('Wish not found');
  const payload = { ...existing[0].payload, read: true };
  await client.upsert(WISHES_COLLECTION, {
    wait: true,
    points: [{ id: Number(wishId), vector: [0.1, 0.1, 0.1, 0.1], payload }],
  });
  return { id: Number(wishId), ...payload };
}

// ── Idea Box / Innovation Board ──────────────────────────
async function createIdea({ title, description, category, submittedBy, submittedByName }) {
  const id = Date.now();
  const payload = {
    title, description, category: category || 'General',
    submittedBy, submittedByName,
    upvotes: [], comments: [],
    status: 'submitted', // submitted | under-review | approved | implemented | rejected
    ideaOfTheMonth: false,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(IDEAS_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

async function getAllIdeas() {
  const result = await client.scroll(IDEAS_COLLECTION, { limit: 1000, with_payload: true });
  return result.points.map(p => ({ id: p.id, ...p.payload })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function upvoteIdea(ideaId, username) {
  const existing = await client.retrieve(IDEAS_COLLECTION, { ids: [Number(ideaId)], with_payload: true });
  if (!existing.length) throw new Error('Idea not found');
  const payload = existing[0].payload;
  const upvotes = payload.upvotes || [];
  const idx = upvotes.indexOf(username);
  if (idx >= 0) upvotes.splice(idx, 1); else upvotes.push(username);
  payload.upvotes = upvotes;
  await client.upsert(IDEAS_COLLECTION, {
    wait: true,
    points: [{ id: Number(ideaId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: ideaId, ...payload };
}

async function setIdeaOfTheMonth(ideaId) {
  // Clear any existing idea of the month
  const all = await client.scroll(IDEAS_COLLECTION, { limit: 1000, with_payload: true });
  for (const p of all.points) {
    if (p.payload.ideaOfTheMonth) {
      p.payload.ideaOfTheMonth = false;
      await client.upsert(IDEAS_COLLECTION, {
        wait: true,
        points: [{ id: p.id, vector: [0, 0, 0, 0], payload: p.payload }],
      });
    }
  }
  // Set the new one
  const existing = await client.retrieve(IDEAS_COLLECTION, { ids: [Number(ideaId)], with_payload: true });
  if (!existing.length) throw new Error('Idea not found');
  const payload = { ...existing[0].payload, ideaOfTheMonth: true, status: 'approved' };
  await client.upsert(IDEAS_COLLECTION, {
    wait: true,
    points: [{ id: Number(ideaId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: ideaId, ...payload };
}

async function updateIdeaStatus(ideaId, status) {
  const existing = await client.retrieve(IDEAS_COLLECTION, { ids: [Number(ideaId)], with_payload: true });
  if (!existing.length) throw new Error('Idea not found');
  const payload = { ...existing[0].payload, status };
  await client.upsert(IDEAS_COLLECTION, {
    wait: true,
    points: [{ id: Number(ideaId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: ideaId, ...payload };
}

async function deleteIdea(ideaId) {
  await client.delete(IDEAS_COLLECTION, { wait: true, points: [Number(ideaId)] });
  return { deleted: true };
}

async function addIdeaComment(ideaId, { username, name, text }) {
  const existing = await client.retrieve(IDEAS_COLLECTION, { ids: [Number(ideaId)], with_payload: true });
  if (!existing.length) throw new Error('Idea not found');
  const payload = existing[0].payload;
  const comments = payload.comments || [];
  comments.push({ id: Date.now(), username, name, text, createdAt: new Date().toISOString() });
  payload.comments = comments;
  await client.upsert(IDEAS_COLLECTION, {
    wait: true,
    points: [{ id: Number(ideaId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: ideaId, ...payload };
}

// ── Trivia / Quiz Arena ──────────────────────────────────
async function createQuiz({ title, description, category, questions, timeLimit, createdBy, createdByName }) {
  const id = Date.now();
  const payload = {
    title, description, category: category || 'General',
    questions: (questions || []).map((q, idx) => ({
      id: idx, question: q.question, options: q.options,
      correctAnswer: q.correctAnswer, points: q.points || 10,
    })),
    timeLimit: timeLimit || 0,
    attempts: [],
    status: 'active',
    createdBy, createdByName,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(QUIZZES_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

async function getAllQuizzes() {
  const result = await client.scroll(QUIZZES_COLLECTION, { limit: 1000, with_payload: true });
  return result.points.map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getQuiz(quizId) {
  const existing = await client.retrieve(QUIZZES_COLLECTION, { ids: [Number(quizId)], with_payload: true });
  if (!existing.length) throw new Error('Quiz not found');
  return { id: existing[0].id, ...existing[0].payload };
}

async function updateQuiz(quizId, fields) {
  const existing = await client.retrieve(QUIZZES_COLLECTION, { ids: [Number(quizId)], with_payload: true });
  if (!existing.length) throw new Error('Quiz not found');
  const payload = { ...existing[0].payload, ...fields, updatedAt: new Date().toISOString() };
  await client.upsert(QUIZZES_COLLECTION, {
    wait: true,
    points: [{ id: Number(quizId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: quizId, ...payload };
}

async function deleteQuiz(quizId) {
  await client.delete(QUIZZES_COLLECTION, { wait: true, points: [Number(quizId)] });
  return { deleted: true };
}

async function submitQuizAttempt(quizId, { username, name, answers, timeTaken }) {
  const existing = await client.retrieve(QUIZZES_COLLECTION, { ids: [Number(quizId)], with_payload: true });
  if (!existing.length) throw new Error('Quiz not found');
  const payload = existing[0].payload;
  // Calculate score
  let score = 0;
  const results = (payload.questions || []).map((q, idx) => {
    const userAnswer = answers[idx];
    const correct = userAnswer === q.correctAnswer;
    if (correct) score += (q.points || 10);
    return { questionId: q.id, userAnswer, correct };
  });
  const totalPossible = payload.questions.reduce((s, q) => s + (q.points || 10), 0);
  // Remove previous attempt by same user
  payload.attempts = (payload.attempts || []).filter(a => a.username !== username);
  const attempt = {
    username, name, answers, results, score, totalPossible,
    timeTaken: timeTaken || 0,
    percentage: totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0,
    completedAt: new Date().toISOString(),
  };
  payload.attempts.push(attempt);
  await client.upsert(QUIZZES_COLLECTION, {
    wait: true,
    points: [{ id: Number(quizId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: quizId, attempt, ...payload };
}

async function getQuizLeaderboard() {
  const result = await client.scroll(QUIZZES_COLLECTION, { limit: 1000, with_payload: true });
  const userScores = {};
  for (const p of result.points) {
    for (const a of (p.payload.attempts || [])) {
      if (!userScores[a.username]) userScores[a.username] = { name: a.name, totalScore: 0, quizCount: 0, totalPercentage: 0 };
      userScores[a.username].totalScore += a.score;
      userScores[a.username].quizCount += 1;
      userScores[a.username].totalPercentage += a.percentage;
    }
  }
  return Object.entries(userScores)
    .map(([username, data]) => ({
      username, name: data.name, totalScore: data.totalScore,
      quizCount: data.quizCount,
      avgPercentage: Math.round(data.totalPercentage / data.quizCount),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ── Photo Gallery / Wall ─────────────────────────────────
async function createPhoto({ title, description, category, imageData, uploadedBy, uploadedByName }) {
  const id = Date.now();
  const payload = {
    title: title || '', description: description || '',
    category: category || 'General',
    imageData: imageData || '',
    reactions: {},
    comments: [],
    uploadedBy, uploadedByName,
    createdAt: new Date().toISOString(),
  };
  await client.upsert(GALLERY_COLLECTION, {
    wait: true,
    points: [{ id, vector: [0, 0, 0, 0], payload }],
  });
  return { id, ...payload };
}

async function getAllPhotos() {
  const result = await client.scroll(GALLERY_COLLECTION, { limit: 1000, with_payload: true });
  return result.points.map(p => ({ id: p.id, ...p.payload }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function deletePhoto(photoId) {
  await client.delete(GALLERY_COLLECTION, { wait: true, points: [Number(photoId)] });
  return { deleted: true };
}

async function togglePhotoReaction(photoId, { username, reaction }) {
  const existing = await client.retrieve(GALLERY_COLLECTION, { ids: [Number(photoId)], with_payload: true });
  if (!existing.length) throw new Error('Photo not found');
  const payload = existing[0].payload;
  if (!payload.reactions) payload.reactions = {};
  if (!payload.reactions[reaction]) payload.reactions[reaction] = [];
  const idx = payload.reactions[reaction].indexOf(username);
  if (idx >= 0) {
    payload.reactions[reaction].splice(idx, 1);
  } else {
    payload.reactions[reaction].push(username);
  }
  await client.upsert(GALLERY_COLLECTION, {
    wait: true,
    points: [{ id: Number(photoId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: photoId, ...payload };
}

async function addPhotoComment(photoId, { username, name, text }) {
  const existing = await client.retrieve(GALLERY_COLLECTION, { ids: [Number(photoId)], with_payload: true });
  if (!existing.length) throw new Error('Photo not found');
  const payload = existing[0].payload;
  if (!payload.comments) payload.comments = [];
  payload.comments.push({ username, name, text, createdAt: new Date().toISOString() });
  await client.upsert(GALLERY_COLLECTION, {
    wait: true,
    points: [{ id: Number(photoId), vector: [0, 0, 0, 0], payload }],
  });
  return { id: photoId, ...payload };
}

module.exports = {
  ensureCollection,
  upsertAsset,
  searchAssets,
  getAllAssets,
  getAssetById,
  deleteAsset,
  updateAsset,
  getStats,
  logActivity,
  getActivityLog,
  addComment,
  getCommentsByAsset,
  deleteComment,
  toggleFavorite,
  getUserFavorites,
  rateAsset,
  getAssetRatings,
  findSimilarAssets,
  addKBArticle,
  getAllKBArticles,
  deleteKBArticle,
  searchKBArticles,
  addNote,
  getUserNotes,
  updateNote,
  deleteNote,
  saveResume,
  getUserResumes,
  getResumeById,
  deleteResume,
  createFeedback,
  getAllFeedback,
  addReply,
  toggleFeedbackLike,
  deleteFeedback,
  updateFeedback,
  deleteReply,
  toggleReplyLike,
  saveDailyLog,
  getDailyLog,
  getUserTaskLogs,
  addDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  createRecognition,
  getAllRecognitions,
  toggleRecognitionLike,
  deleteRecognition,
  createJob,
  getAllJobs,
  getJobById,
  applyToJob,
  updateJobStatus,
  updateApplicantStatus,
  deleteJob,
  addEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  searchEmployeesBySkill,
  getProfile,
  saveProfile,
  createPoll,
  getAllPolls,
  votePoll,
  deletePoll,
  closePoll,
  setLeaveStatus,
  getAllLeaveStatuses,
  getUserLeaveHistory,
  createAnnouncement,
  getAllAnnouncements,
  toggleAnnouncementPin,
  deleteAnnouncement,
  updateAnnouncement,
  createBooking,
  getBookingsForDate,
  getAllBookings,
  deleteBooking,
  createQuickLink,
  getAllQuickLinks,
  updateQuickLink,
  deleteQuickLink,
  createStandupPage,
  getAllStandupPages,
  getStandupPage,
  updateStandupPageMembers,
  deleteStandupPage,
  addStandupEntry,
  getStandupEntries,
  updateStandupEntry,
  deleteStandupEntry,
  addStandupMessage,
  getStandupMessages,
  deleteStandupMessage,
  createMeeting,
  getAllMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  addActionItem,
  updateActionItem,
  deleteActionItem,
  createWish,
  getWishesForUser,
  markWishRead,
  createIdea,
  getAllIdeas,
  upvoteIdea,
  setIdeaOfTheMonth,
  updateIdeaStatus,
  deleteIdea,
  addIdeaComment,
  createQuiz,
  getAllQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getQuizLeaderboard,
  createPhoto,
  getAllPhotos,
  deletePhoto,
  togglePhotoReaction,
  addPhotoComment,
};
