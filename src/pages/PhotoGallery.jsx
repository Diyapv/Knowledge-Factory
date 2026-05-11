import { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Trash2, Heart, MessageCircle, Send, X, ThumbsUp, Laugh, Star, Flame, Image, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { fetchPhotos, uploadPhotoApi, deletePhotoApi, togglePhotoReactionApi, addPhotoCommentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['General', 'Team Events', 'Celebrations', 'Office Moments', 'Outings', 'Hackathons', 'Milestones', 'Fun'];

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { key: 'laugh', emoji: '😂', label: 'Haha' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getTotalReactions(reactions) {
  if (!reactions) return 0;
  return Object.values(reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0);
}

// ── Upload Modal ──────────────────────────────────────
function UploadModal({ onUpload, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!imageData) return;
    setUploading(true);
    try {
      await onUpload({ title, description, category, imageData });
      onClose();
    } catch (err) { console.error(err); }
    setUploading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-t-2xl p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Camera className="w-5 h-5" /> Upload Photo</h2>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image Upload */}
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 transition-colors dark:border-gray-600">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="space-y-2">
                <Image className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to select an image (max 5MB)</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What's in this photo?"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Tell us about this moment..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" disabled={!imageData || uploading}
            className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 shadow">
            {uploading ? 'Uploading...' : 'Share Photo'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────
function Lightbox({ photo, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white text-gray-800 hover:bg-red-500 hover:text-white rounded-full p-2.5 shadow-xl transition-colors">
        <X className="w-8 h-8" />
      </button>
      <img src={photo.imageData} alt={photo.title}
        className="max-h-[80vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()} />
      {(photo.title || photo.description) && (
        <div className="mt-4 text-center px-4" onClick={e => e.stopPropagation()}>
          {photo.title && <p className="text-white text-lg font-semibold">{photo.title}</p>}
          {photo.description && <p className="text-gray-400 text-sm mt-1 max-w-xl">{photo.description}</p>}
          <p className="text-gray-500 text-xs mt-2">By {photo.uploadedByName} &middot; {photo.category}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────
export default function PhotoGallery() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setPhotos(await fetchPhotos()); } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleUpload(data) {
    await uploadPhotoApi({ ...data, uploadedBy: user.username, uploadedByName: user.name });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this photo?')) return;
    try { await deletePhotoApi(id); load(); } catch (err) { console.error(err); }
  }

  async function handleReaction(photoId, reactionKey) {
    try {
      const updated = await togglePhotoReactionApi(photoId, { username: user.username, reaction: reactionKey });
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, reactions: updated.reactions } : p));
    } catch (err) { console.error(err); }
    setShowReactionPicker(null);
  }

  async function handleComment(photoId) {
    const text = (commentTexts[photoId] || '').trim();
    if (!text) return;
    try {
      const updated = await addPhotoCommentApi(photoId, { username: user.username, name: user.name, text });
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, comments: updated.comments } : p));
      setCommentTexts(prev => ({ ...prev, [photoId]: '' }));
    } catch (err) { console.error(err); }
  }

  const filtered = photos.filter(p => filterCategory === 'All' || p.category === filterCategory);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Photo Gallery</h1>
              <p className="text-sm opacity-80">{photos.length} photos &middot; Team events, celebrations & office moments</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1 px-4 py-2 bg-white text-pink-700 rounded-lg font-medium hover:bg-pink-50 shadow">
              <Plus className="w-4 h-4" /> Upload Photo
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterCategory === c
              ? 'bg-pink-600 text-white shadow'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-pink-100'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading gallery...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Camera className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No photos yet</p>
          <p className="text-sm text-gray-400">Be the first to share a moment!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(photo => {
            const totalReactions = getTotalReactions(photo.reactions);
            const commentCount = (photo.comments || []).length;
            const isExpanded = expandedComments[photo.id];

            return (
              <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative cursor-pointer group h-64 overflow-hidden" onClick={() => setLightbox(photo)}>
                  <img src={photo.imageData} alt={photo.title || 'Photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 dark:bg-gray-900/80 text-pink-600 dark:text-pink-400 text-xs font-semibold rounded-full shadow-sm backdrop-blur-sm">
                    {photo.category}
                  </span>
                  {/* Hover overlay info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {photo.title && <p className="text-white font-semibold text-sm drop-shadow-lg">{photo.title}</p>}
                    <p className="text-white/80 text-xs drop-shadow">{photo.uploadedByName} &middot; {timeAgo(photo.createdAt)}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  {/* Author */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                        {getInitials(photo.uploadedByName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{photo.uploadedByName}</p>
                        <p className="text-xs text-gray-400">{timeAgo(photo.createdAt)}</p>
                      </div>
                    </div>
                    {(isAdmin || photo.uploadedBy === user.username) && (
                      <button onClick={() => handleDelete(photo.id)} className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-lg flex-shrink-0 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {photo.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{photo.description}</p>}

                  {/* Reactions Display */}
                  {totalReactions > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {REACTIONS.filter(r => photo.reactions?.[r.key]?.length > 0).map(r => (
                        <button key={r.key} onClick={() => handleReaction(photo.id, r.key)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${photo.reactions[r.key]?.includes(user.username)
                            ? 'bg-pink-50 border-pink-300 text-pink-700 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300'
                            : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 hover:border-pink-300'}`}>
                          {r.emoji} {photo.reactions[r.key].length}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-1 border-t dark:border-gray-700">
                    <div className="relative">
                      <button onClick={() => setShowReactionPicker(showReactionPicker === photo.id ? null : photo.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 py-1">
                        <Heart className="w-4 h-4" /> React
                      </button>
                      {showReactionPicker === photo.id && (
                        <div className="absolute bottom-8 left-0 bg-white dark:bg-gray-700 rounded-xl shadow-xl border dark:border-gray-600 p-1.5 flex gap-1 z-10">
                          {REACTIONS.map(r => (
                            <button key={r.key} onClick={() => handleReaction(photo.id, r.key)}
                              title={r.label}
                              className="text-xl hover:scale-125 transition-transform p-1">
                              {r.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setExpandedComments(prev => ({ ...prev, [photo.id]: !prev[photo.id] }))}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 py-1">
                      <MessageCircle className="w-4 h-4" /> {commentCount > 0 ? `${commentCount} Comments` : 'Comment'}
                    </button>
                  </div>

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="space-y-2 pt-1">
                      {(photo.comments || []).map((c, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                            {getInitials(c.name)}
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-1.5 text-sm flex-1">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs">{c.name}</span>
                            <p className="text-gray-600 dark:text-gray-400">{c.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(c.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input value={commentTexts[photo.id] || ''} onChange={e => setCommentTexts(prev => ({ ...prev, [photo.id]: e.target.value }))}
                          placeholder="Add a comment..."
                          onKeyDown={e => e.key === 'Enter' && handleComment(photo.id)}
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        <button onClick={() => handleComment(photo.id)}
                          className="p-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && <UploadModal onUpload={handleUpload} onClose={() => setShowUpload(false)} />}

      {/* Lightbox */}
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
