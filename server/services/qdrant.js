const { QdrantClient } = require('@qdrant/js-client-rest');

const OLLAMA_EMBED_URL = 'http://localhost:11434/api/embed';
const EMBED_MODEL = 'nomic-embed-text';
const COLLECTION = 'assets';
const ACTIVITY_COLLECTION = 'activity_log';
const COMMENTS_COLLECTION = 'comments';
const KB_COLLECTION = 'kb_articles';
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
};
