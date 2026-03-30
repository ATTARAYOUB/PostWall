const db = require('../db/database');

const PostModel = {
  getAll({ search = '', author = '', tag = '', date = '', page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*,
        COUNT(DISTINCT l.id) AS likes,
        COUNT(DISTINCT c.id) AS comments_count
      FROM posts p
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.content LIKE ? OR p.author LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (author) {
      query += ` AND p.author LIKE ?`;
      params.push(`%${author}%`);
    }
    if (tag) {
      query += ` AND p.tags LIKE ?`;
      params.push(`%${tag}%`);
    }
    if (date === 'today') {
      query += ` AND DATE(p.created_at) = DATE('now')`;
    } else if (date === 'week') {
      query += ` AND p.created_at >= DATE('now', '-7 days')`;
    } else if (date === 'month') {
      query += ` AND p.created_at >= DATE('now', '-30 days')`;
    }

    // Pinned posts first, then by date
    query += ` GROUP BY p.id ORDER BY p.pinned DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const posts = db.prepare(query).all(...params);

    // Attach reactions to each post
    posts.forEach(post => {
      post.reactions = this.getReactions(post.id);
    });

    // Count total for pagination
    let countQuery = `SELECT COUNT(*) as total FROM posts p WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (p.content LIKE ? OR p.author LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (author) {
      countQuery += ` AND p.author LIKE ?`;
      countParams.push(`%${author}%`);
    }
    if (tag) {
      countQuery += ` AND p.tags LIKE ?`;
      countParams.push(`%${tag}%`);
    }
    if (date === 'today') {
      countQuery += ` AND DATE(p.created_at) = DATE('now')`;
    } else if (date === 'week') {
      countQuery += ` AND p.created_at >= DATE('now', '-7 days')`;
    } else if (date === 'month') {
      countQuery += ` AND p.created_at >= DATE('now', '-30 days')`;
    }

    const { total } = db.prepare(countQuery).get(...countParams);
    return { posts, total, page: Number(page), limit: Number(limit) };
  },

  getById(id) {
    const post = db.prepare(`
      SELECT p.*,
        COUNT(DISTINCT l.id) AS likes,
        COUNT(DISTINCT c.id) AS comments_count
      FROM posts p
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id);
    if (post) post.reactions = this.getReactions(id);
    return post;
  },

  create({ content, author, color, tags }) {
    const result = db.prepare(
      `INSERT INTO posts (content, author, color, tags) VALUES (?, ?, ?, ?)`
    ).run(content, author, color || '#fef08a', tags || '');
    return this.getById(result.lastInsertRowid);
  },

  update(id, { content, author, color, tags }) {
    db.prepare(
      `UPDATE posts SET content = ?, author = ?, color = ?, tags = ? WHERE id = ?`
    ).run(content, author, color, tags, id);
    return this.getById(id);
  },

  delete(id) {
    return db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
  },

  // Increment view counter and return updated post
  incrementViews(id) {
    db.prepare(`UPDATE posts SET views = views + 1 WHERE id = ?`).run(id);
    return this.getById(id);
  },

  // Toggle pin status
  togglePin(id) {
    db.prepare(`UPDATE posts SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END WHERE id = ?`).run(id);
    return this.getById(id);
  },

  // Reactions
  getReactions(postId) {
    const rows = db.prepare(
      `SELECT emoji, COUNT(*) as count FROM reactions WHERE post_id = ? GROUP BY emoji`
    ).all(postId);
    // Return as { emoji: count }
    const result = {};
    rows.forEach(r => { result[r.emoji] = r.count; });
    return result;
  },

  addReaction(postId, emoji) {
    const allowed = ['❤️', '😂', '👍', '🔥', '😮'];
    if (!allowed.includes(emoji)) return null;
    db.prepare(`INSERT INTO reactions (post_id, emoji) VALUES (?, ?)`).run(postId, emoji);
    return this.getReactions(postId);
  },

  getLikeCount(id) {
    return db.prepare(`SELECT COUNT(*) as count FROM likes WHERE post_id = ?`).get(id);
  },

  addLike(postId) {
    db.prepare(`INSERT INTO likes (post_id) VALUES (?)`).run(postId);
    return this.getLikeCount(postId);
  },

  removeLike(postId) {
    db.prepare(`DELETE FROM likes WHERE id = (SELECT id FROM likes WHERE post_id = ? LIMIT 1)`).run(postId);
    return this.getLikeCount(postId);
  }
};

module.exports = PostModel;
