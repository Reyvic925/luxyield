<<<<<<< HEAD
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', ConfigSchema);
=======
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', ConfigSchema);
>>>>>>> d9aeb3e (Improve admin panel mobile responsiveness)
