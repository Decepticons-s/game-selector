const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  playerCount: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    optimal: [Number]
  },
  tags: [String],
  coverImage: String,
  images: [String],
  videos: [{
    url: String,
    title: String,
    duration: Number
  }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  duration: Number,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);
