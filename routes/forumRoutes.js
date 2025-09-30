const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { listPosts, createPost, toggleLike, reply, remove } = require('../controllers/forumController');
const ForumPost = require('../models/ForumPost');

// Publicly readable forum list so students can view discussions easily
router.get('/', listPosts);
// Allow anonymous post creation; author will be null unless authenticated
router.post('/', createPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/reply', protect, reply);
router.delete('/:id', protect, remove);

// Temporary debug endpoint to verify DB connectivity and collection
router.get('/_debug', async (req, res) => {
  try {
    const count = await ForumPost.countDocuments();
    res.json({ readyState: mongoose.connection.readyState, count });
  } catch (e) {
    res.status(500).json({ message: 'debug error', error: e?.message });
  }
});

module.exports = router;


