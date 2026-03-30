const CommentModel = require('../models/commentModel');
const PostModel = require('../models/postModel');

const commentController = {
  getByPost(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      const comments = CommentModel.getByPostId(req.params.id);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  create(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });

      const { content, author } = req.body;
      if (!content || !content.trim()) return res.status(400).json({ error: 'Le commentaire ne peut pas être vide' });
      if (content.trim().length > 300) return res.status(400).json({ error: 'Commentaire trop long (max 300 caractères)' });

      const comment = CommentModel.create({
        post_id: req.params.id,
        content: content.trim(),
        author: author ? author.trim() : 'Anonyme'
      });
      res.status(201).json(comment);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  delete(req, res) {
    try {
      CommentModel.delete(req.params.commentId);
      res.json({ message: 'Commentaire supprimé' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  }
};

module.exports = commentController;
