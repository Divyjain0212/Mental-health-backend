const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const ForumPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: 'General Discussion' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAnonymous: { type: Boolean, default: true },
    tags: [{ type: String }],
    replies: [ReplySchema],
  },
  { timestamps: true }
);

const ForumPost = mongoose.model('ForumPost', ForumPostSchema);
module.exports = ForumPost;


