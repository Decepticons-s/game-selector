const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true },
  nickname: String,
  role: { type: String, default: 'admin' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
