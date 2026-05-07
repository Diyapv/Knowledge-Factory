const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

export async function fetchAssets({ type, category, level, status } = {}) {
  const params = new URLSearchParams();
  if (type && type !== 'All') params.set('type', type);
  if (category && category !== 'All') params.set('category', category);
  if (level && level !== 'All Levels') params.set('level', level);
  if (status) params.set('status', status);
  const res = await fetch(`${API_URL}/assets?${params}`);
  return res.json();
}

export async function deleteAsset(id) {
  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || '';
  const res = await fetch(`${API_URL}/assets/${id}?user=${encodeURIComponent(username)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete asset');
  return res.json();
}

export async function updateAssetStatus(id, status, extra = {}) {
  const res = await fetch(`${API_URL}/assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...extra }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function updateAssetContent(id, fields) {
  const res = await fetch(`${API_URL}/assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error('Failed to update asset');
  return res.json();
}

export async function fetchAssetById(id) {
  const res = await fetch(`${API_URL}/assets/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function submitAsset(asset) {
  const res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  });
  if (!res.ok) throw new Error('Failed to submit asset');
  return res.json();
}

export async function submitAssetWithFile(file, metadata) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  const res = await fetch(`${API_URL}/assets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload asset');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`);
  return res.json();
}

export async function checkAIStatus() {
  const res = await fetch(`${API_URL}/ai/status`);
  return res.json();
}

export async function analyzeReusability({ code, description, type, language }) {
  const res = await fetch(`${API_URL}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, description, type, language }),
  });
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
}

export async function aiSearch(query, { type, category, level } = {}) {
  const res = await fetch(`${API_URL}/ai/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, type, category, level }),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function aiSuggestImprovements(code, language) {
  const res = await fetch(`${API_URL}/ai/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) throw new Error('Suggestions failed');
  return res.json();
}

export async function fetchMetadata() {
  const res = await fetch(`${API_URL}/metadata`);
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(`${API_URL}/notifications`);
  return res.json();
}

export async function fetchSearchSuggestions() {
  const res = await fetch(`${API_URL}/search/suggestions`);
  return res.json();
}

// ── MISRA & Safety Compliance ─────────────────────────────
export async function checkMISRACompliance(code, language) {
  const res = await fetch(`${API_URL}/ai/misra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) throw new Error('MISRA check failed');
  return res.json();
}

// ── Activity Log ──────────────────────────────────────────
export async function fetchActivityLog(limit = 50) {
  const res = await fetch(`${API_URL}/activity?limit=${limit}`);
  return res.json();
}

// ── Comments ──────────────────────────────────────────────
export async function fetchComments(assetId) {
  const res = await fetch(`${API_URL}/assets/${assetId}/comments`);
  return res.json();
}

export async function postComment(assetId, user, text) {
  const res = await fetch(`${API_URL}/assets/${assetId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, text }),
  });
  if (!res.ok) throw new Error('Failed to post comment');
  return res.json();
}

export async function removeComment(commentId) {
  const res = await fetch(`${API_URL}/comments/${commentId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete comment');
  return res.json();
}

// ── Favorites ─────────────────────────────────────────────
export async function toggleFavorite(assetId, user) {
  const res = await fetch(`${API_URL}/assets/${assetId}/favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
}

export async function fetchFavorites(username) {
  const res = await fetch(`${API_URL}/favorites/${encodeURIComponent(username)}`);
  return res.json();
}

// ── Ratings ───────────────────────────────────────────────
export async function rateAsset(assetId, user, rating) {
  const res = await fetch(`${API_URL}/assets/${assetId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, rating }),
  });
  if (!res.ok) throw new Error('Failed to rate asset');
  return res.json();
}

export async function fetchRatings(assetId) {
  const res = await fetch(`${API_URL}/assets/${assetId}/ratings`);
  return res.json();
}

// ── Similar Assets (duplicate detection) ──────────────────
export async function findSimilarAssets(name, description, threshold = 0.7) {
  const res = await fetch(`${API_URL}/assets/similar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, threshold }),
  });
  return res.json();
}

// ── EB Knowledge Chatbot ──────────────────────────────────
export async function chatWithEB(message, history = []) {
  const res = await fetch(`${API_URL}/chat/eb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}

// ── InfoHub Server Connection ─────────────────────────────
export async function connectInfoHub(token) {
  const res = await fetch(`${API_URL}/infohub/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function getInfoHubStatus() {
  const res = await fetch(`${API_URL}/infohub/status`);
  return res.json();
}

export async function disconnectInfoHub() {
  const res = await fetch(`${API_URL}/infohub/disconnect`, { method: 'POST' });
  return res.json();
}

// ── Knowledge Base Articles ───────────────────────────────
export async function fetchKBArticles() {
  const res = await fetch(`${API_URL}/kb`);
  return res.json();
}

export async function addKBArticle({ title, content, category, source, addedBy }) {
  const res = await fetch(`${API_URL}/kb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, category, source, addedBy }),
  });
  if (!res.ok) throw new Error('Failed to add article');
  return res.json();
}

export async function deleteKBArticle(id) {
  const res = await fetch(`${API_URL}/kb/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete article');
  return res.json();
}

export async function uploadKBFiles(files, { category, addedBy } = {}) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  if (category) formData.append('category', category);
  if (addedBy) formData.append('addedBy', addedBy);
  const res = await fetch(`${API_URL}/kb/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('File upload failed');
  return res.json();
}

// ── InfoHub (Confluence) Integration ──────────────────────
export async function testInfoHubConnection(token) {
  const res = await fetch(`${API_URL}/infohub/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function fetchInfoHubSpaces(token) {
  const res = await fetch(`${API_URL}/infohub/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Failed to fetch spaces');
  return res.json();
}

export async function fetchInfoHubPages(token, spaceKey, limit = 50) {
  const res = await fetch(`${API_URL}/infohub/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, spaceKey, limit }),
  });
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}

export async function searchInfoHub(token, query, limit = 25) {
  const res = await fetch(`${API_URL}/infohub/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, query, limit }),
  });
  if (!res.ok) throw new Error('InfoHub search failed');
  return res.json();
}

export async function importInfoHubPages(token, pages, addedBy) {
  const res = await fetch(`${API_URL}/infohub/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, pages, addedBy }),
  });
  if (!res.ok) throw new Error('Import failed');
  return res.json();
}

export async function syncInfoHubSpace(token, spaceKey, addedBy) {
  const res = await fetch(`${API_URL}/infohub/sync-space`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, spaceKey, addedBy }),
  });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}
