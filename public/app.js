/* ============================================================
   Mur de Post-it 2.0 — app.js
   Fonctionnalités : CRUD posts, commentaires, likes,
   réactions emoji, épinglage, compteur de vues, dark mode,
   recherche/filtres, pagination.
   ============================================================ */

const API = '/api/posts';

// ── State ────────────────────────────────────────────────────
const state = {
  currentPage: 1,
  search: '',
  author: '',
  tag: '',
  date: '',
  likedPosts: JSON.parse(localStorage.getItem('likedPosts') || '[]'),
};

// ── DOM refs ─────────────────────────────────────────────────
const postsGrid       = document.getElementById('posts-grid');
const postCountEl     = document.getElementById('post-count');
const loadingSpinner  = document.getElementById('loading-spinner');
const emptyState      = document.getElementById('empty-state');
const paginationEl    = document.getElementById('pagination');
const searchInput     = document.getElementById('search-input');
const clearSearch     = document.getElementById('clear-search');
const filterAuthor    = document.getElementById('filter-author');
const filterTag       = document.getElementById('filter-tag');

// Modal post
const postModal        = document.getElementById('post-modal');
const postForm         = document.getElementById('post-form');
const modalTitle       = document.getElementById('modal-title');
const editPostId       = document.getElementById('edit-post-id');
const postAuthor       = document.getElementById('post-author');
const postContent      = document.getElementById('post-content');
const postTag          = document.getElementById('post-tag');
const postColor        = document.getElementById('post-color');
const charCounter      = document.getElementById('char-counter');

// Modal comments
const commentModal     = document.getElementById('comment-modal');
const commentsList     = document.getElementById('comments-list');
const commentForm      = document.getElementById('comment-form');
const commentPostId    = document.getElementById('comment-post-id');
const commentAuthor    = document.getElementById('comment-author');
const commentContent   = document.getElementById('comment-content');

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.style.position = 'relative';
  t.style.overflow = 'hidden';
  t.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <span class="toast-msg">${msg}</span>
    <div class="toast-bar"></div>
  `;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => {
    t.classList.add('hiding');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, 3000);
}

// ── API helper ────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// ── Escape HTML ───────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Format date ───────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}


// ── Load & render posts ───────────────────────────────────────
async function loadPosts(resetPage = true) {
  if (resetPage) state.currentPage = 1;

  const params = new URLSearchParams({
    page:   state.currentPage,
    limit:  12,
    search: state.search,
    author: state.author,
    tag:    state.tag,
    date:   state.date,
  });
  // Remove empty params
  [...params.entries()].forEach(([k, v]) => { if (!v) params.delete(k); });

  loadingSpinner.classList.remove('hidden');
  postsGrid.innerHTML = '';
  emptyState.classList.add('hidden');
  paginationEl.classList.add('hidden');

  try {
    const { posts, total, limit } = await apiFetch(`${API}?${params}`);
    document.getElementById('post-count-num').textContent = total;
    postCountEl.title = `${total} post${total !== 1 ? 's' : ''}`;

    if (!posts.length) {
      emptyState.classList.remove('hidden');
    } else {
      posts.forEach(p => postsGrid.appendChild(createPostCard(p)));
      renderPagination(total, limit, state.currentPage);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    loadingSpinner.classList.add('hidden');
  }
}

// ── Build a post card ─────────────────────────────────────────
function createPostCard(post) {
  const liked = state.likedPosts.includes(post.id);
  const card = document.createElement('div');
  card.className = `post-card${post.pinned ? ' is-pinned' : ''}`;
  card.dataset.id = post.id;
  card.style.background = post.color || '#fef08a';

  // Build reactions HTML
  const reactionsHtml = post.reactions && Object.keys(post.reactions).length
    ? `<div class="post-reactions">
        ${Object.entries(post.reactions).map(([emoji, count]) =>
          `<span class="reaction-badge">${emoji} ${count}</span>`
        ).join('')}
       </div>`
    : '';

  card.innerHTML = `
    <div class="post-tape"></div>
    <div class="post-card-header">
      <span class="post-author">${escapeHtml(post.author)}</span>
      <div class="post-badges">
        ${post.pinned ? '<span class="pin-badge" title="Épinglé">📌</span>' : ''}
        ${post.tags ? `<span class="post-tag">${escapeHtml(post.tags)}</span>` : ''}
      </div>
    </div>
    <p class="post-content">${escapeHtml(post.content)}</p>
    ${reactionsHtml}
    <div class="post-meta">
      <span class="post-date">${formatDate(post.created_at)}</span>
      <span class="post-views">👁 ${post.views || 0}</span>
    </div>
    <div class="post-actions">
      <button class="action-btn like-btn ${liked ? 'liked' : ''}" data-id="${post.id}" title="J'aime">
        ❤️ <span class="like-count">${post.likes || 0}</span>
      </button>
      <button class="action-btn comment-btn" data-id="${post.id}" title="Commentaires">
        💬 <span class="comment-count">${post.comments_count || 0}</span>
      </button>
      <button class="action-btn react-btn" data-id="${post.id}" title="Réagir">😊</button>
      <span class="spacer"></span>
      <button class="action-btn pin-btn" data-id="${post.id}" title="${post.pinned ? 'Désépingler' : 'Épingler'}">📌</button>
      <button class="action-btn edit-btn" data-id="${post.id}" title="Modifier">✏️</button>
      <button class="action-btn delete-btn" data-id="${post.id}" title="Supprimer">🗑️</button>
    </div>
    <div class="emoji-picker hidden" data-id="${post.id}">
      ${['❤️','😂','👍','🔥','😮'].map(e =>
        `<button class="emoji-opt" data-emoji="${e}" data-id="${post.id}">${e}</button>`
      ).join('')}
    </div>
  `;
  return card;
}


// ── Pagination ────────────────────────────────────────────────
function renderPagination(total, limit, page) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) { paginationEl.classList.add('hidden'); return; }

  paginationEl.classList.remove('hidden');
  paginationEl.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '←';
  prev.disabled = page <= 1;
  prev.addEventListener('click', () => { state.currentPage--; loadPosts(false); });
  paginationEl.appendChild(prev);

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.className = `page-btn${i === page ? ' active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => { state.currentPage = i; loadPosts(false); });
    paginationEl.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = '→';
  next.disabled = page >= pages;
  next.addEventListener('click', () => { state.currentPage++; loadPosts(false); });
  paginationEl.appendChild(next);
}

// ── Post Modal ────────────────────────────────────────────────
function openPostModal(post = null) {
  postForm.reset();
  charCounter.textContent = '0';
  editPostId.value = '';
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  document.querySelector('.color-swatch[data-color="#fef08a"]').classList.add('active');
  postColor.value = '#fef08a';

  if (post) {
    modalTitle.textContent = 'Modifier le Post-it';
    document.getElementById('submit-post-btn').textContent = 'Enregistrer';
    editPostId.value = post.id;
    postAuthor.value = post.author;
    postContent.value = post.content;
    charCounter.textContent = post.content.length;
    postTag.value = post.tags || '';
    postColor.value = post.color || '#fef08a';
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === post.color);
    });
  } else {
    modalTitle.textContent = 'Nouveau Post-it';
    document.getElementById('submit-post-btn').textContent = 'Publier';
  }

  postModal.classList.remove('hidden');
  postAuthor.focus();
}

function closePostModal() {
  postModal.classList.add('hidden');
  postForm.reset();
  [postAuthor, postContent].forEach(el => el.classList.remove('error'));
}

// ── Comment Modal ─────────────────────────────────────────────
async function openCommentModal(postId) {
  commentPostId.value = postId;
  commentForm.reset();
  commentsList.innerHTML = '<p class="no-comments">Chargement...</p>';
  commentModal.classList.remove('hidden');
  // Increment view counter
  apiFetch(`${API}/${postId}/view`, { method: 'POST' }).catch(() => {});
  await loadComments(postId);
  commentContent.focus();
}

function closeCommentModal() {
  commentModal.classList.add('hidden');
  commentForm.reset();
}

async function loadComments(postId) {
  try {
    const comments = await apiFetch(`${API}/${postId}/comments`);
    if (!comments.length) {
      commentsList.innerHTML = '<p class="no-comments">Aucun commentaire pour l\'instant.</p>';
      return;
    }
    commentsList.innerHTML = '';
    comments.forEach(c => {
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.dataset.id = c.id;
      item.innerHTML = `
        <span class="comment-author">${escapeHtml(c.author)}</span>
        <span class="comment-text">${escapeHtml(c.content)}</span>
        <span class="comment-date">${formatDate(c.created_at)}</span>
        <button class="comment-delete" data-id="${c.id}" data-post="${postId}" title="Supprimer">🗑 Supprimer</button>
      `;
      commentsList.appendChild(item);
    });
  } catch (err) {
    commentsList.innerHTML = '<p class="no-comments">Erreur lors du chargement.</p>';
  }
}


// ── Theme ─────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function updateThemeBtn(theme) {
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Event Listeners ───────────────────────────────────────────

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeBtn(next);
});

// Open post modal
document.getElementById('open-modal-btn').addEventListener('click', () => openPostModal());
document.getElementById('empty-add-btn').addEventListener('click', () => openPostModal());

// Close modals
document.getElementById('close-modal-btn').addEventListener('click', closePostModal);
document.getElementById('cancel-modal-btn').addEventListener('click', closePostModal);
document.getElementById('close-comment-modal').addEventListener('click', closeCommentModal);
postModal.addEventListener('click', e => { if (e.target === postModal) closePostModal(); });
commentModal.addEventListener('click', e => { if (e.target === commentModal) closeCommentModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePostModal(); closeCommentModal(); }
});

// Color swatches
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    postColor.value = swatch.dataset.color;
  });
});

// Char counter + progress bar
postContent.addEventListener('input', () => {
  const len = postContent.value.length;
  charCounter.textContent = len;
  const fill = document.getElementById('char-bar-fill');
  const pct = (len / 500) * 100;
  fill.style.width = pct + '%';
  fill.className = 'char-bar-fill' + (pct >= 90 ? ' danger' : pct >= 70 ? ' warn' : '');
});

// Search
searchInput.addEventListener('input', () => {
  clearSearch.classList.toggle('hidden', !searchInput.value);
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  clearSearch.classList.add('hidden');
  state.search = '';
  loadPosts();
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    state.search = searchInput.value.trim();
    loadPosts();
  }
});

// Filters
document.getElementById('filter-btn').addEventListener('click', () => {
  state.search = searchInput.value.trim();
  state.author = filterAuthor.value.trim();
  state.tag    = filterTag.value;
  state.date   = document.getElementById('filter-date').value;
  loadPosts();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  searchInput.value = '';
  filterAuthor.value = '';
  filterTag.value = '';
  document.getElementById('filter-date').value = '';
  clearSearch.classList.add('hidden');
  state.search = '';
  state.author = '';
  state.tag    = '';
  state.date   = '';
  loadPosts();
});

// Post form submit
postForm.addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;
  [postAuthor, postContent].forEach(el => el.classList.remove('error'));

  if (!postAuthor.value.trim()) { postAuthor.classList.add('error'); valid = false; }
  if (!postContent.value.trim()) { postContent.classList.add('error'); valid = false; }
  if (!valid) return;

  const id = editPostId.value;
  const body = {
    author:  postAuthor.value.trim(),
    content: postContent.value.trim(),
    color:   postColor.value,
    tags:    postTag.value,
  };

  try {
    if (id) {
      await apiFetch(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Post modifié avec succès', 'success');
    } else {
      await apiFetch(API, { method: 'POST', body: JSON.stringify(body) });
      showToast('Post créé avec succès', 'success');
    }
    closePostModal();
    loadPosts();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Comment form submit
commentForm.addEventListener('submit', async e => {
  e.preventDefault();
  const postId = commentPostId.value;
  const content = commentContent.value.trim();
  if (!content) { commentContent.classList.add('error'); return; }
  commentContent.classList.remove('error');

  try {
    await apiFetch(`${API}/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, author: commentAuthor.value.trim() }),
    });
    commentForm.reset();
    await loadComments(postId);
    // Update comment count on card
    const countEl = postsGrid.querySelector(`[data-id="${postId}"] .comment-count`);
    if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
  } catch (err) {
    showToast(err.message, 'error');
  }
});


// ── Post card actions (event delegation) ─────────────────────
postsGrid.addEventListener('click', async e => {
  const likeBtn    = e.target.closest('.like-btn');
  const editBtn    = e.target.closest('.edit-btn');
  const deleteBtn  = e.target.closest('.delete-btn');
  const commentBtn = e.target.closest('.comment-btn');
  const pinBtn     = e.target.closest('.pin-btn');
  const reactBtn   = e.target.closest('.react-btn');
  const emojiOpt   = e.target.closest('.emoji-opt');

  // ── Like ──
  if (likeBtn) {
    const id = parseInt(likeBtn.dataset.id);
    const liked = state.likedPosts.includes(id);
    try {
      const { likes } = await apiFetch(`${API}/${id}/like`, {
        method: 'POST',
        body: JSON.stringify({ action: liked ? 'unlike' : 'like' }),
      });
      likeBtn.querySelector('.like-count').textContent = likes;
      if (liked) {
        state.likedPosts = state.likedPosts.filter(x => x !== id);
        likeBtn.classList.remove('liked');
      } else {
        state.likedPosts.push(id);
        likeBtn.classList.add('liked');
      }
      localStorage.setItem('likedPosts', JSON.stringify(state.likedPosts));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ── Edit ──
  if (editBtn) {
    try {
      const post = await apiFetch(`${API}/${editBtn.dataset.id}`);
      openPostModal(post);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ── Delete ──
  if (deleteBtn) {
    if (!confirm('Supprimer ce post ?')) return;
    const card = deleteBtn.closest('.post-card');
    card.classList.add('removing');
    card.addEventListener('animationend', async () => {
      try {
        await apiFetch(`${API}/${deleteBtn.dataset.id}`, { method: 'DELETE' });
        showToast('Post supprimé', 'success');
        loadPosts(false);
      } catch (err) {
        showToast(err.message, 'error');
        card.classList.remove('removing');
      }
    });
  }

  // ── Comments ──
  if (commentBtn) {
    openCommentModal(commentBtn.dataset.id);
  }

  // ── Pin ──
  if (pinBtn) {
    try {
      const { pinned, message } = await apiFetch(`${API}/${pinBtn.dataset.id}/pin`, { method: 'PATCH' });
      showToast(message, 'success');
      loadPosts(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ── Toggle emoji picker ──
  if (reactBtn) {
    const picker = reactBtn.closest('.post-card').querySelector('.emoji-picker');
    picker.classList.toggle('hidden');
  }

  // ── Add reaction ──
  if (emojiOpt) {
    const id = emojiOpt.dataset.id;
    const emoji = emojiOpt.dataset.emoji;
    try {
      const { reactions } = await apiFetch(`${API}/${id}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      // Update reactions display on card
      const card = postsGrid.querySelector(`[data-id="${id}"]`);
      let reactionsEl = card.querySelector('.post-reactions');
      if (!reactionsEl) {
        reactionsEl = document.createElement('div');
        reactionsEl.className = 'post-reactions';
        card.querySelector('.post-meta').before(reactionsEl);
      }
      reactionsEl.innerHTML = Object.entries(reactions)
        .map(([e, c]) => `<span class="reaction-badge">${e} ${c}</span>`)
        .join('');
      card.querySelector('.emoji-picker').classList.add('hidden');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
});

// ── Comment delete (delegated) ────────────────────────────────
commentsList.addEventListener('click', async e => {
  const btn = e.target.closest('.comment-delete');
  if (!btn) return;
  const commentId = btn.dataset.id;
  const postId    = btn.dataset.post;
  try {
    await apiFetch(`${API}/${postId}/comments/${commentId}`, { method: 'DELETE' });
    btn.closest('.comment-item').remove();
    if (!commentsList.querySelector('.comment-item')) {
      commentsList.innerHTML = '<p class="no-comments">Aucun commentaire pour l\'instant.</p>';
    }
    const countEl = postsGrid.querySelector(`[data-id="${postId}"] .comment-count`);
    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── Auto-refresh every 30s ────────────────────────────────────
setInterval(() => loadPosts(false), 30000);

// ── Init ──────────────────────────────────────────────────────
initTheme();
loadPosts();
