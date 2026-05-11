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

// ── Personal Notes ────────────────────────────────────────
export async function fetchNotes(username) {
  const res = await fetch(`${API_URL}/notes?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

export async function createNote(username, { title, content, color }) {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, title, content, color }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
}

export async function updateNoteApi(id, username, { title, content, color }) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, title, content, color }),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
}

export async function deleteNoteApi(id, username) {
  const res = await fetch(`${API_URL}/notes/${id}?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete note');
  return res.json();
}

// ── Resume Builder ────────────────────────────────────────
export async function fetchResumes(username) {
  const res = await fetch(`${API_URL}/resumes?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Failed to fetch resumes');
  return res.json();
}

export async function fetchResumeById(id) {
  const res = await fetch(`${API_URL}/resumes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch resume');
  return res.json();
}

export async function saveResumeApi(username, data) {
  const res = await fetch(`${API_URL}/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, ...data }),
  });
  if (!res.ok) throw new Error('Failed to save resume');
  return res.json();
}

export async function deleteResumeApi(id, username) {
  const res = await fetch(`${API_URL}/resumes/${id}?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete resume');
  return res.json();
}

// ── Open Feedback ─────────────────────────────────────────
export async function fetchFeedback() {
  const res = await fetch(`${API_URL}/feedback`);
  if (!res.ok) throw new Error('Failed to fetch feedback');
  return res.json();
}

export async function createFeedbackApi(username, displayName, { title, content, category }) {
  const res = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName, title, content, category }),
  });
  if (!res.ok) throw new Error('Failed to post feedback');
  return res.json();
}

export async function addReplyApi(feedbackId, username, displayName, text) {
  const res = await fetch(`${API_URL}/feedback/${feedbackId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName, text }),
  });
  if (!res.ok) throw new Error('Failed to add reply');
  return res.json();
}

export async function toggleFeedbackLikeApi(feedbackId, username) {
  const res = await fetch(`${API_URL}/feedback/${feedbackId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to toggle like');
  return res.json();
}

export async function deleteFeedbackApi(id, username) {
  const res = await fetch(`${API_URL}/feedback/${id}?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete feedback');
  return res.json();
}

export async function deleteReplyApi(feedbackId, replyId, username) {
  const res = await fetch(`${API_URL}/feedback/${feedbackId}/reply/${replyId}?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete reply');
  return res.json();
}

export async function toggleReplyLikeApi(feedbackId, replyId, username) {
  const res = await fetch(`${API_URL}/feedback/${feedbackId}/reply/${replyId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to toggle reply like');
  return res.json();
}

export async function notifyMentionsApi({ mentionedBy, context, feedbackTitle, messageText }) {
  const res = await fetch(`${API_URL}/feedback/notify-mentions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mentionedBy, context, feedbackTitle, messageText }),
  });
  if (!res.ok) throw new Error('Failed to notify mentions');
  return res.json();
}

// ── Daily Task Tracker ────────────────────────────────────
export async function fetchDailyLog(username, date) {
  const res = await fetch(`${API_URL}/tasks/daily?username=${encodeURIComponent(username)}&date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch daily log');
  return res.json();
}

export async function saveDailyLogApi(username, date, data) {
  const res = await fetch(`${API_URL}/tasks/daily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, date, ...data }),
  });
  if (!res.ok) throw new Error('Failed to save daily log');
  return res.json();
}

export async function fetchTaskHistory(username, limit = 30) {
  const res = await fetch(`${API_URL}/tasks/history?username=${encodeURIComponent(username)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch task history');
  return res.json();
}

// ── Device Asset Management ───────────────────────────────
export async function fetchDevices({ type, status, assignedTo } = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (assignedTo) params.set('assignedTo', assignedTo);
  const res = await fetch(`${API_URL}/devices?${params}`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function addDeviceApi(data) {
  const res = await fetch(`${API_URL}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add device');
  return res.json();
}

export async function updateDeviceApi(id, data) {
  const res = await fetch(`${API_URL}/devices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update device');
  return res.json();
}

export async function deleteDeviceApi(id) {
  const res = await fetch(`${API_URL}/devices/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete device');
  return res.json();
}

// ── Recognition System ──────────────────────────────────
export async function fetchRecognitions() {
  const res = await fetch(`${API_URL}/recognitions`);
  return res.json();
}

export async function createRecognitionApi(data) {
  const res = await fetch(`${API_URL}/recognitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create recognition');
  return res.json();
}

export async function toggleRecognitionLikeApi(id, username) {
  const res = await fetch(`${API_URL}/recognitions/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to toggle like');
  return res.json();
}

export async function deleteRecognitionApi(id) {
  const res = await fetch(`${API_URL}/recognitions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete recognition');
  return res.json();
}

// ── Internal Job Board ──────────────────────────────────
export async function fetchJobs() {
  const res = await fetch(`${API_URL}/jobs`);
  return res.json();
}

export async function createJobApi(data) {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

export async function applyToJobApi(id, data) {
  const res = await fetch(`${API_URL}/jobs/${id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to apply');
  }
  return res.json();
}

export async function updateJobStatusApi(id, status) {
  const res = await fetch(`${API_URL}/jobs/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update job status');
  return res.json();
}

export async function updateApplicantStatusApi(id, username, status) {
  const res = await fetch(`${API_URL}/jobs/${id}/applicant`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, status }),
  });
  if (!res.ok) throw new Error('Failed to update applicant status');
  return res.json();
}

export async function deleteJobApi(id) {
  const res = await fetch(`${API_URL}/jobs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete job');
  return res.json();
}

// ── Employee Directory ──────────────────────────────────
export async function fetchEmployees() {
  const res = await fetch(`${API_URL}/employees`);
  return res.json();
}

export async function addEmployeeApi(data) {
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add employee');
  }
  return res.json();
}

export async function updateEmployeeApi(id, data) {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update employee');
  return res.json();
}

export async function deleteEmployeeApi(id) {
  const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete employee');
  return res.json();
}

export async function bulkUploadEmployeesApi(file, addedBy) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('addedBy', addedBy);
  const res = await fetch(`${API_URL}/employees/bulk-upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload');
  }
  return res.json();
}

// ── Ask an Expert / Skill Search ──────────────────────────
export async function searchEmployeesBySkillApi(skill, minRating = 1) {
  const params = new URLSearchParams({ skill, minRating: String(minRating) });
  const res = await fetch(`${API_URL}/employees/search-skills?${params}`);
  return res.json();
}

// ── User Profile ──
export async function getProfileApi(username) {
  const res = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}`);
  return res.json();
}

export async function saveProfileApi(username, data) {
  const res = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save profile');
  return res.json();
}

// ── Polls ──────────────────────────────────────────────
export async function fetchPolls() {
  const res = await fetch(`${API_URL}/polls`);
  return res.json();
}

export async function createPollApi(data) {
  const res = await fetch(`${API_URL}/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create poll');
  return res.json();
}

export async function votePollApi(id, username, optionIds) {
  const res = await fetch(`${API_URL}/polls/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, optionIds }),
  });
  if (!res.ok) throw new Error('Failed to vote');
  return res.json();
}

export async function closePollApi(id, username) {
  const res = await fetch(`${API_URL}/polls/${id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to close poll');
  return res.json();
}

export async function deletePollApi(id) {
  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || '';
  const res = await fetch(`${API_URL}/polls/${id}?user=${encodeURIComponent(username)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete poll');
  return res.json();
}

// ── Leave / WFH Tracker ────────────────────────────────────
export async function fetchLeaveStatuses(date) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/leave-status${params}`);
  return res.json();
}

export async function setLeaveStatusApi(data) {
  const res = await fetch(`${API_URL}/leave-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function fetchLeaveHistory(username) {
  const res = await fetch(`${API_URL}/leave-status/${encodeURIComponent(username)}/history`);
  return res.json();
}

// ── Announcements ────────────────────────────────────
export async function fetchAnnouncements() {
  const res = await fetch(`${API_URL}/announcements`);
  return res.json();
}

export async function createAnnouncementApi(data) {
  const res = await fetch(`${API_URL}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create announcement');
  return res.json();
}

export async function togglePinApi(id, username) {
  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const role = currentUser.role || '';
  const res = await fetch(`${API_URL}/announcements/${id}/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role }),
  });
  if (!res.ok) throw new Error('Failed to toggle pin');
  return res.json();
}

export async function deleteAnnouncementApi(id) {
  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || '';
  const role = currentUser.role || '';
  const res = await fetch(`${API_URL}/announcements/${id}?user=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete announcement');
  return res.json();
}

export async function updateAnnouncementApi(id, data) {
  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || '';
  const role = currentUser.role || '';
  const res = await fetch(`${API_URL}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role, ...data }),
  });
  if (!res.ok) throw new Error('Failed to update announcement');
  return res.json();
}

// ── Bookings ──────────────────────────────────────────────
export async function fetchBookings(date) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/bookings${params}`);
  return res.json();
}

export async function createBookingApi(data) {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create booking');
  }
  return res.json();
}

export async function deleteBookingApi(id) {
  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || '';
  const res = await fetch(`${API_URL}/bookings/${id}?user=${encodeURIComponent(username)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete booking');
  return res.json();
}

// ── Quick Links / Bookmarks ───────────────────────────────
export async function fetchQuickLinks() {
  const res = await fetch(`${API_URL}/quicklinks`);
  return res.json();
}

export async function createQuickLinkApi(data) {
  const res = await fetch(`${API_URL}/quicklinks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create link');
  return res.json();
}

export async function updateQuickLinkApi(id, data) {
  const res = await fetch(`${API_URL}/quicklinks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update link');
  return res.json();
}

export async function deleteQuickLinkApi(id) {
  const res = await fetch(`${API_URL}/quicklinks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete link');
  return res.json();
}

// ── Standup Notes / Daily Scrum ───────────────────────────
export async function fetchStandupPages() {
  const res = await fetch(`${API_URL}/standups/pages`);
  return res.json();
}

export async function fetchStandupPage(pageId) {
  const res = await fetch(`${API_URL}/standups/pages/${pageId}`);
  if (!res.ok) throw new Error('Page not found');
  return res.json();
}

export async function createStandupPageApi(data) {
  const res = await fetch(`${API_URL}/standups/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create standup page');
  return res.json();
}

export async function updateStandupMembersApi(pageId, members) {
  const res = await fetch(`${API_URL}/standups/pages/${pageId}/members`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members }),
  });
  if (!res.ok) throw new Error('Failed to update members');
  return res.json();
}

export async function deleteStandupPageApi(pageId) {
  const res = await fetch(`${API_URL}/standups/pages/${pageId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete page');
  return res.json();
}

export async function fetchStandupEntries(pageId, date) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/standups/pages/${pageId}/entries${params}`);
  return res.json();
}

export async function addStandupEntryApi(pageId, data) {
  const res = await fetch(`${API_URL}/standups/pages/${pageId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add entry');
  return res.json();
}

export async function updateStandupEntryApi(entryId, data) {
  const res = await fetch(`${API_URL}/standups/entries/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function deleteStandupEntryApi(entryId) {
  const res = await fetch(`${API_URL}/standups/entries/${entryId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
  return res.json();
}
