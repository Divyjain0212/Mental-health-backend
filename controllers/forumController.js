const ForumPost = require('../models/ForumPost');

// GET /api/forum (public)
exports.listPosts = async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .populate('author', 'email role')
      .lean();
    res.json(posts);
  } catch (e) {
    console.error('listPosts error:', e);
    res.status(500).json({ message: 'Server Error', error: e?.message });
  }
};

// POST /api/forum (public create allowed; author set if authenticated)
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, isAnonymous, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'title and content required' });

    const post = await ForumPost.create({
      author: req.user?._id || undefined,
      title,
      content,
      category: category || 'General Discussion',
      isAnonymous: isAnonymous !== false,
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json(post);
  } catch (e) {
    console.error('createPost error:', e);
    res.status(500).json({ message: 'Server Error', error: e?.message });
  }
};

// POST /api/forum/:id/like (auth)
exports.toggleLike = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { id } = req.params;
    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id.toString();
    const idx = post.likes.findIndex(u => u.toString() === uid);
    if (idx >= 0) post.likes.splice(idx, 1); else post.likes.push(req.user._id);
    await post.save();
    res.json(post);
  } catch (e) {
    console.error('toggleLike error:', e);
    res.status(500).json({ message: 'Server Error', error: e?.message });
  }
};

// POST /api/forum/:id/reply (auth)
exports.reply = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });
    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    post.replies.push({ author: req.user._id, text });
    await post.save();
    res.status(201).json(post);
  } catch (e) {
    console.error('reply error:', e);
    res.status(500).json({ message: 'Server Error', error: e?.message });
  }
};

// DELETE /api/forum/:id (auth: author or admin)
exports.remove = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { id } = req.params;
    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (post.author && post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ success: true });
  } catch (e) {
    console.error('remove error:', e);
    res.status(500).json({ message: 'Server Error', error: e?.message });
  }
};


