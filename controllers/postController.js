const PostModel = require('../models/postModel');

const postController = {
  getAll(req, res) {
    try {
      const { search, author, tag, date, page = 1, limit = 12 } = req.query;
      const result = PostModel.getAll({ search, author, tag, date, page, limit });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  getOne(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  create(req, res) {
    try {
      const { content, author, color, tags } = req.body;
      if (!content || !content.trim()) return res.status(400).json({ error: 'Le contenu est requis' });
      if (!author || !author.trim()) return res.status(400).json({ error: "L'auteur est requis" });
      if (content.trim().length > 500) return res.status(400).json({ error: 'Contenu trop long (max 500 caractères)' });

      const post = PostModel.create({
        content: content.trim(),
        author: author.trim(),
        color: color || '#fef08a',
        tags: tags || ''
      });
      res.status(201).json(post);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  update(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });

      const { content, author, color, tags } = req.body;
      if (!content || !content.trim()) return res.status(400).json({ error: 'Le contenu est requis' });
      if (!author || !author.trim()) return res.status(400).json({ error: "L'auteur est requis" });

      const updated = PostModel.update(req.params.id, {
        content: content.trim(),
        author: author.trim(),
        color: color || post.color,
        tags: tags !== undefined ? tags : post.tags
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  delete(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      PostModel.delete(req.params.id);
      res.json({ message: 'Post supprimé avec succès' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  like(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      const { action } = req.body;
      const result = action === 'unlike'
        ? PostModel.removeLike(req.params.id)
        : PostModel.addLike(req.params.id);
      res.json({ likes: result.count });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  // PATCH /:id/pin — toggle pin status
  togglePin(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      const updated = PostModel.togglePin(req.params.id);
      res.json({ pinned: updated.pinned, message: updated.pinned ? 'Post épinglé' : 'Post désépinglé' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  // POST /:id/view — increment view counter
  incrementViews(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      const updated = PostModel.incrementViews(req.params.id);
      res.json({ views: updated.views });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  },

  // POST /:id/react — add an emoji reaction
  addReaction(req, res) {
    try {
      const post = PostModel.getById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post introuvable' });
      const { emoji } = req.body;
      if (!emoji) return res.status(400).json({ error: 'Emoji requis' });
      const reactions = PostModel.addReaction(req.params.id, emoji);
      if (!reactions) return res.status(400).json({ error: 'Emoji non autorisé' });
      res.status(201).json({ reactions });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
  }
};

module.exports = postController;
