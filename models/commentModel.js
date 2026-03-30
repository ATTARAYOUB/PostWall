const db = require('../db/database');

const CommentModel = {
  getByPostId(postId) {
    return db.prepare(
      `SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC`
    ).all(postId);
  },

  create({ post_id, content, author }) {
    const result = db.prepare(
      `INSERT INTO comments (post_id, content, author) VALUES (?, ?, ?)`
    ).run(post_id, content, author || 'Anonyme');
    return db.prepare(`SELECT * FROM comments WHERE id = ?`).get(result.lastInsertRowid);
  },

  delete(id) {
    return db.prepare(`DELETE FROM comments WHERE id = ?`).run(id);
  }
};

module.exports = CommentModel;
