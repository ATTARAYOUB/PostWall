const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// Posts CRUD
router.get('/', postController.getAll);
router.get('/:id', postController.getOne);
router.post('/', postController.create);
router.put('/:id', postController.update);
router.delete('/:id', postController.delete);

// Likes
router.post('/:id/like', postController.like);

// Pin / Unpin
router.patch('/:id/pin', postController.togglePin);

// Views
router.post('/:id/view', postController.incrementViews);

// Reactions
router.post('/:id/react', postController.addReaction);

// Comments
router.get('/:id/comments', commentController.getByPost);
router.post('/:id/comments', commentController.create);
router.delete('/:id/comments/:commentId', commentController.delete);

module.exports = router;
